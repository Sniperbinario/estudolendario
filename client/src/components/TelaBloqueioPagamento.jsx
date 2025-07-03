import React, { useState } from "react";

const planos = [
  {
    nome: "Mensal",
    valor: 29.90,
    descricao: "Acesso completo por 30 dias.",
    id: "mensal"
  },
  {
    nome: "Anual",
    valor: 230.00,
    descricao: "Economize! Acesso completo por 365 dias.",
    id: "anual"
  }
];

export default function LandingPage() {
  const [planoSelecionado, setPlanoSelecionado] = useState(planos[0].id);

  const iniciarPagamento = async () => {
    // Aqui você pode manter seu fluxo atual, só enviar o tipo de plano junto!
    // Exemplo:
    fetch("/sua-rota-de-pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plano: planoSelecionado,
        // ...outros dados do pagamento...
      })
    })
      .then(res => res.json())
      .then(data => {
        // redireciona ou mostra o checkout
        window.location.href = data.urlPagamento;
      });
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      justifyContent: "center",
      background: "#181820",
      color: "#fff"
    }}>
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Escolha seu plano</h1>
      <div style={{ display: "flex", gap: 24 }}>
        {planos.map(plano => (
          <div
            key={plano.id}
            onClick={() => setPlanoSelecionado(plano.id)}
            style={{
              border: planoSelecionado === plano.id ? "2px solid #ffd700" : "2px solid #333",
              background: planoSelecionado === plano.id ? "#24243b" : "#23233a",
              borderRadius: 16,
              padding: 32,
              minWidth: 200,
              cursor: "pointer",
              transition: "border 0.2s, background 0.2s"
            }}
          >
            <h2 style={{ fontSize: 28 }}>{plano.nome}</h2>
            <p style={{ fontSize: 20, fontWeight: "bold", margin: "18px 0" }}>R$ {plano.valor.toFixed(2)}</p>
            <p style={{ fontSize: 16, color: "#ccc" }}>{plano.descricao}</p>
            {planoSelecionado === plano.id && (
              <span style={{ color: "#ffd700", fontWeight: "bold" }}>Selecionado</span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={iniciarPagamento}
        style={{
          marginTop: 32,
          background: "#ffd700",
          color: "#23233a",
          border: "none",
          borderRadius: 12,
          fontSize: 20,
          padding: "16px 48px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Assinar {planos.find(p => p.id === planoSelecionado).nome}
      </button>
    </div>
  );
}
