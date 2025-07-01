
const express = require("express");
const path = require("path");
const cors = require("cors");
const mercadopago = require("mercadopago");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CORS CORRIGIDO AQUI:
app.use(cors({
  origin: "https://estudolendario.com"
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

let pagamentosAprovados = [];

// === CRIAR ASSINATURA COM CARTÃO ===
app.post("/criar-assinatura-cartao", async (req, res) => {
  try {
    const { uid, tipo } = req.body;
    const preco = tipo === "anual" ? 299.90 : 29.90;

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
      metadata: {
        uid,
        tipo
      }
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
      pagamento.data &&
      pagamento.data.id &&
      pagamento.data.id !== "123456"
    ) {
      const id = pagamento.data.id;
      const info = await mercadopago.payment.findById(id);

      if (info.body.status === "approved") {
        const email = info.body.payer.email;
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
