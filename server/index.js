const express = require("express");
const path = require("path");
const mercadopago = require("mercadopago");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// === CONFIGURAR MERCADO PAGO ===
mercadopago.configure({
  access_token: "APP_USR-8622645961365072-061621-60f44beedfea7fc90e88fa1bb9c2b31d-2498676423"
});

// === ROTA: Assinatura com Cartão (3 dias grátis) ===
app.post("/criar-assinatura-cartao", async (req, res) => {
  try {
    const preference = {
      items: [{
        title: "Assinatura Estudo Lendário",
        quantity: 1,
        currency_id: "BRL",
        unit_price: 29.90
      }],
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

// === ROTA: Geração de Pix (teste de 2h) ===
app.post("/pagar-pix-teste", async (req, res) => {
  try {
    const payment_data = {
      transaction_amount: 5,
      description: "Teste de 2h na plataforma",
      payment_method_id: "pix",
      payer: {
        email: "teste@usuario.com"
      }
    };

    const pagamento = await mercadopago.payment.create(payment_data);
    const dados = pagamento.body.point_of_interaction.transaction_data;
    res.json({
      qr_code: dados.qr_code_base64,
      copia_colar: dados.qr_code
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar Pix." });
  }
});

// === ROTA: Webhook ===
app.post("/webhook", async (req, res) => {
  try {
    const pagamento = req.body;
    if (pagamento.type === "payment") {
      const id = pagamento.data.id;
      const info = await mercadopago.payment.findById(id);
      if (info.body.status === "approved") {
        console.log("💰 Pagamento aprovado:", info.body.description);
        // Aqui você pode salvar no banco ou liberar o usuário manualmente
      }
    }
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

// === SERVIR FRONTEND DO REACT ===
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
