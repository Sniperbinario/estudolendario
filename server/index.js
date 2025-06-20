const express = require("express");
const path = require("path");
const cors = require("cors");
const mercadopago = require("mercadopago");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cors());

// === MERCADO PAGO ===
mercadopago.configure({
  access_token: "APP_USR-8622645961365072-061621-60f44beedfea7fc90e88fa1bb9c2b31d-2498676423" // seu token real aqui
});

// === FIREBASE ADMIN ===
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://console.firebase.google.com/u/1/project/antiprocastinador/database/antiprocastinador-default-rtdb/data/~2F" // 🔁 adicione isso se ainda não tinha
  });
}

const firestore = admin.firestore();
const realtimeDB = admin.database(); // ✅ Realtime Database

let pagamentosAprovados = [];

// === CRIAR ASSINATURA COM CARTÃO ===
app.post("/criar-assinatura-cartao", async (req, res) => {
  try {
    const preference = {
      items: [
        {
          title: "Assinatura Estudo Lendário",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 2.00 // Valor de teste
        }
      ],
      back_urls: {
        success: "https://estudolendario.com/sucesso",
        failure: "https://estudolendario.com/erro",
        pending: "https://estudolendario.com/pendente"
      },
      auto_return: "approved",
      metadata: {
        uid: req.body.uid || "desconhecido"
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

        pagamentosAprovados.push(email);
        console.log("✅ Pagamento aprovado:", email);

        if (uid && uid !== "desconhecido") {
          // 🔥 Atualiza Firestore
          await firestore.collection("users").doc(uid).update({
            acessoLiberado: true,
            dataAssinatura: new Date().toISOString()
          });

          // 🔥 Atualiza Realtime Database
          await realtimeDB.ref(`acessos/${uid}`).set({
            liberado: true,
            liberadoEm: new Date().toISOString()
          });

          console.log("🔥 Firebase liberado com UID:", uid);
        } else {
          // Tenta localizar pelo e-mail no Firestore
          const snapshot = await firestore.collection("usuarios").where("email", "==", email).get();
          if (!snapshot.empty) {
            snapshot.forEach(async (doc) => {
              await doc.ref.update({
                acessoLiberado: true,
                dataAssinatura: new Date().toISOString()
              });
              console.log("🔥 Firebase liberado por e-mail:", email);
            });
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
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
