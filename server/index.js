const express = require("express");
const path = require("path");
const cors = require("cors");
const mercadopago = require("mercadopago");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// === MERCADO PAGO ===
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_TOKEN
});

// === FIREBASE ADMIN ===
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://antiprocastinador-default-rtdb.firebaseio.com/"
  });
}

const firestore = admin.firestore();
const realtimeDB = admin.database();
const messaging = admin.messaging();

let pagamentosAprovados = [];

// === PUSH NOTIFICATION — Salvar token FCM ===
app.post("/salvar-token-push", async (req, res) => {
  try {
    const { uid, token, editalAtivo } = req.body;
    if (!uid || !token) return res.status(400).json({ error: "uid e token obrigatórios" });
    await firestore.collection("users").doc(uid).set({
      fcmToken: token,
      editalNotificacao: editalAtivo || null,
      tokenSalvoEm: new Date().toISOString()
    }, { merge: true });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao salvar token:", err);
    res.status(500).json({ error: err.message });
  }
});

// === PUSH NOTIFICATION — Enviar para um usuário específico ===
app.post("/enviar-push", async (req, res) => {
  try {
    const { uid, titulo, corpo } = req.body;
    const userDoc = await firestore.collection("users").doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Usuário não encontrado" });
    const { fcmToken } = userDoc.data();
    if (!fcmToken) return res.status(404).json({ error: "Token FCM não encontrado" });

    await messaging.send({
      token: fcmToken,
      notification: { title: titulo || "EstudoLendário 📚", body: corpo || "Hora de estudar!" },
      webpush: {
        notification: { icon: "/distintivo.png", badge: "/distintivo.png" },
        fcmOptions: { link: "/" }
      }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar push:", err);
    res.status(500).json({ error: err.message });
  }
});

// === PUSH NOTIFICATION — Enviar para TODOS com token salvo ===
app.post("/enviar-push-todos", async (req, res) => {
  try {
    const { titulo, corpo } = req.body;
    const users = await firestore.collection("users").where("fcmToken", "!=", null).get();
    const promises = [];
    users.forEach(doc => {
      const { fcmToken } = doc.data();
      if (!fcmToken) return;
      promises.push(messaging.send({
        token: fcmToken,
        notification: { title: titulo || "EstudoLendário 📚", body: corpo || "Hora de estudar!" },
        webpush: { notification: { icon: "/distintivo.png" }, fcmOptions: { link: "/" } }
      }).catch(e => console.log("Falha token:", e.message)));
    });
    await Promise.all(promises);
    res.json({ ok: true, enviados: promises.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === JOB DE TESTE — Dispara push a cada 1 minuto para todos com token ===
setInterval(async () => {
  try {
    const users = await firestore.collection("users").where("fcmToken", "!=", null).get();
    const agora = new Date().toLocaleTimeString("pt-BR");
    users.forEach(doc => {
      const { fcmToken } = doc.data();
      if (!fcmToken) return;
      messaging.send({
        token: fcmToken,
        notification: {
          title: "🔔 EstudoLendário — Teste",
          body: `Notificação de teste às ${agora} ✅`
        },
        webpush: { notification: { icon: "/distintivo.png" }, fcmOptions: { link: "/" } }
      }).catch(e => console.log("Erro push teste:", e.message));
    });
    console.log(`✅ Push de teste enviado às ${agora}`);
  } catch (e) {
    console.error("Erro job push:", e.message);
  }
}, 60000); // 1 minuto

// === CRIAR ASSINATURA COM CARTÃO ===
app.post("/criar-assinatura-cartao", async (req, res) => {
  try {
    const { uid, plano } = req.body; // <--- pega 'plano' enviado pelo frontend
    const tipo = plano || "mensal"; // <--- default para mensal se vier vazio
    const preco = tipo === "anual" ? 230.00 : 29.90; // <--- preço certo

    const preference = {
      items: [
        {
          title: `Plano ${tipo === "anual" ? "Anual" : "Mensal"} - Estudo Lendário`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: preco,
        }
      ],
      back_urls: {
        success: "https://estudolendario.com/sucesso",
        failure: "https://estudolendario.com/erro",
        pending: "https://estudolendario.com/pendente"
      },
      auto_return: "approved",
      metadata: { uid, tipo }
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ init_point: response.body.init_point });
  } catch (err) {
    console.error("Erro ao criar assinatura:", err);
    res.status(500).json({ error: "Erro ao criar assinatura." });
  }
});

// === WEBHOOK ===
app.post("/webhook", async (req, res) => {
  console.log("📡 Webhook RECEBIDO:", JSON.stringify(req.body, null, 2));
  try {
    const pagamento = req.body;

    if (
      pagamento.type === "payment" &&
      pagamento.data?.id &&
      pagamento.data.id !== "123456"
    ) {
      const id = pagamento.data.id;
      const info = await mercadopago.payment.findById(id);

      if (info.body.status === "approved") {
        const uid = info.body.metadata?.uid;
        const tipo = info.body.metadata?.tipo || "mensal";
        const dias = tipo === "anual" ? 365 : 30;
        const validade = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

        if (uid && uid !== "desconhecido") {
          await firestore.collection("users").doc(uid).update({
            plano: tipo,
            ativo: true,
            validade,
            acessoLiberado: true,
            dataAssinatura: new Date().toISOString(),
            origem: "pagamento"
          });

          await realtimeDB.ref(`acessos/${uid}`).set({
            liberado: true,
            liberadoEm: new Date().toISOString()
          });

          console.log("🔥 Plano", tipo, "ativado para UID:", uid);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// === ROTA DE TESTE DO WEBHOOK ===
app.get("/webhook", (req, res) => {
  res.send("Webhook ativo ✅");
});

// === ROTA OPCIONAL DE VERIFICAÇÃO DE PAGAMENTO ===
app.get("/verificar-pagamento", (req, res) => {
  const email = req.query.email || "teste@usuario.com";
  const pago = pagamentosAprovados.includes(email);
  res.json({ pago });
});

// === FRONTEND REACT ===
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
