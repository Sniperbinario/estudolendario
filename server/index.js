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
  access_token: "APP_USR-8622645961365072-061621-60f44beedfea7fc90e88fa1bb9c2b31d-2498676423"
});

// === FIREBASE ADMIN ===
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();
let pagamentosAprovados = [];

// === ASSINATURA COM CARTÃO ===
app.post("/criar-assinatura-cartao", async (req, res) => {
  try {
    const preference = {
      items: [
        {
          title: "Assinatura Estudo Lendário",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 2.00
        }
      ],
      back_urls: {
        success: "https://estudolendario.com/sucesso",
        failure: "https://estudolendario.com/erro",
        pending: "https://estudolendario.com/pendente"
      },
      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ init_point: response.body.init_point });
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar assinatura." });
  }
});

// === PIX DE TESTE (ainda presente, mas não usado) ===
app.post("/pagar-pix-teste", async (req, res) => {
  try {
    const { uid } = req.body;
    const payment_data = {
      transaction_amount: 5,
      description: "Teste de 2h na plataforma",
      payment_method_id: "pix",
      payer: {
        email: "teste@usuario.com"
      },
      metadata: {
        uid: uid || "desconhecido"
      }
    };

    const pagamento = await mercadopago.payment.create(payment_data);
    const dados = pagamento.body.point_of_interaction.transaction_data;

    res.json({
      qr_code: dados.qr_code_base64,
      copia_colar: dados.qr_code,
      email: pagamento.body.payer.email
    });
  } catch (err) {
    console.log("Erro ao gerar PIX:", err.message);
    res.status(500).json({ error: "Erro ao gerar Pix." });
  }
});

// === WEBHOOK ===
app.post("/webhook", async (req, res) => {
  try {
    const pagamento = req.body;

    if (pagamento.type === "payment") {
      const id = pagamento.data.id;
      const info = await mercadopago.payment.findById(id);

      if (info.body.status === "approved") {
        const email = info.body.payer.email;
        const uid = info.body.metadata?.uid;

        pagamentosAprovados.push(email);
        console.log("✅ Pagamento aprovado:", email);

        if (uid && uid !== "desconhecido") {
          await firestore.collection("users").doc(uid).update({
            acessoLiberado: true,
            dataAssinatura: new Date().toISOString()
          });
          console.log("🔥 Firebase liberado com UID:", uid);
        } else {
          // Busca pelo e-mail no Firestore
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
    console.log("❌ Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// === VERIFICAR PAGAMENTO ===
app.get("/verificar-pagamento", (req, res) => {
  const email = req.query.email || "teste@usuario.com";
  const pago = pagamentosAprovados.includes(email);
  res.json({ pago });
});

// === SERVE FRONTEND REACT ===
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
