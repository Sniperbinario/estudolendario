// server/index.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const mercadopago = require("mercadopago");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cors());

// === CONFIGURAÇÃO DO MERCADO PAGO ===
mercadopago.configure({
  access_token: "SUA_ACCESS_TOKEN_AQUI"
});

// === CONFIGURAÇÃO DO FIREBASE ADMIN COM VARIÁVEL DE AMBIENTE ===
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

// Lista de emails aprovados (opcional — usado para rota de verificação simples)
let pagamentosAprovados = [];

// === ROTA: Assinatura com Cartão (3 dias grátis) ===
app.post("/criar-assinatura-cartao", async (req, res) => {
  try {
    const preference = {
      items: [
        {
          title: "Assinatura Estudo Lendário",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 29.90
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

// === ROTA: Gerar Pix de Teste (ainda sem UID atrelado) ===
app.post("/pagar-pix-teste", async (req, res) => {
  try {
    const payment_data = {
      transaction_amount: 5,
      description: "Teste de 2h na plataforma",
      payment_method_id: "pix",
      payer: {
        email: "teste@usuario.com"
      }
      // Em breve: incluir metadata com UID
    };

    const pagamento = await mercadopago.payment.create(payment_data);
    const dados = pagamento.body.point_of_interaction.transaction_data;
    res.json({
      qr_code: dados.qr_code_base64,
      copia_colar: dados.qr_code,
      email: pagamento.body.payer.email
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar Pix." });
  }
});

// === WEBHOOK: Pagamento aprovado → Atualiza Firebase ===
app.post("/webhook", async (req, res) => {
  try {
    const pagamento = req.body;
    if (pagamento.type === "payment") {
      const id = pagamento.data.id;
      const info = await mercadopago.payment.findById(id);

      if (info.body.status === "approved") {
        console.log("✅ Pagamento aprovado:", info.body.payer.email);
        pagamentosAprovados.push(info.body.payer.email);

        // 🔥 Em breve: recuperar UID do metadata e atualizar Firestore
        const uid = info.body.metadata?.uid;
        if (uid) {
          await firestore.collection("users").doc(uid).update({
            acessoLiberado: true
          });
          console.log("🔥 Firebase atualizado para UID:", uid);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.log("❌ Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// === ROTA: Verificar se pagamento foi aprovado (via email simples) ===
app.get("/verificar-pagamento", (req, res) => {
  const email = req.query.email || "teste@usuario.com";
  const pago = pagamentosAprovados.includes(email);
  res.json({ pago });
});

// === SERVIR FRONTEND REACT ===
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
