import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { StudyIcon } from "../features/study/components/StudyIcon";

export default function MinhaConta({ setTela, onNameChange }) {
  const user = auth.currentUser;
  const [dados, setDados] = useState({ nome: "", endereco: "", cpf: "", nascimento: "", email: "" });
  const [novaSenha, setNovaSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [plano, setPlano] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [validade, setValidade] = useState(null);
  const [tempoRestante, setTempoRestante] = useState("");
  const [acessoLiberado, setAcessoLiberado] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;
      const data = snap.data();
      setDados((atual) => ({ ...atual, ...data }));
      setPlano(data.plano || "");
      setAtivo(Boolean(data.ativo) && data.ativo !== "false");
      setValidade(data.validade || null);
      setAcessoLiberado(Boolean(data.acessoLiberado) && data.acessoLiberado !== "false");
    };
    carregarDados();
  }, [user]);

  useEffect(() => {
    const ativarPlanoTeste = async () => {
      if (!user || !acessoLiberado || plano) return;
      const dataValidade = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      await updateDoc(doc(db, "users", user.uid), { plano: "teste", ativo: true, origem: "teste_gratis", validade: dataValidade });
      setPlano("teste");
      setAtivo(true);
      setValidade(dataValidade);
    };
    ativarPlanoTeste();
  }, [user, acessoLiberado, plano]);

  useEffect(() => {
    if (!validade) return undefined;
    const atualizarTempo = () => {
      const diff = new Date(validade) - new Date();
      if (diff <= 0) return setTempoRestante("Expirado");
      const dias = Math.floor(diff / 86400000);
      const horas = Math.floor((diff / 3600000) % 24);
      const minutos = Math.floor((diff / 60000) % 60);
      setTempoRestante(`${dias}d ${horas}h ${minutos}min`);
    };
    atualizarTempo();
    const intervalo = setInterval(atualizarTempo, 60000);
    return () => clearInterval(intervalo);
  }, [validade]);

  const handleSalvar = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), { nome: dados.nome, endereco: dados.endereco, nascimento: dados.nascimento });
      onNameChange?.(dados.nome);
      setMensagem("Dados atualizados com sucesso.");
    } catch (error) {
      setMensagem(`Erro ao atualizar: ${error.message}`);
    }
  };

  const handleTrocarSenha = async () => {
    if (novaSenha.length < 6) return setMensagem("A nova senha deve ter pelo menos 6 caracteres.");
    try {
      await updatePassword(user, novaSenha);
      setNovaSenha("");
      setMensagem("Senha atualizada com sucesso.");
    } catch (error) {
      setMensagem(error.code === "auth/requires-recent-login" ? "Faça logout e entre novamente para trocar sua senha." : `Erro ao trocar senha: ${error.message}`);
    }
  };

  const gerarLinkWhatsApp = () => {
    const msg = `Olá, quero cancelar meu teste grátis.\nNome: ${dados.nome}\nEmail: ${dados.email}\nCPF: ${dados.cpf}`;
    return `https://wa.me/55SEUNUMEROAQUI?text=${encodeURIComponent(msg)}`;
  };

  const estaEmTeste = plano === "teste" && ativo && tempoRestante !== "Expirado";
  const nomePlano = () => plano?.toLowerCase() === "mensal" ? "Plano mensal" : plano?.toLowerCase() === "anual" ? "Plano anual" : plano === "teste" ? "Teste gratuito" : "Plano ativo";

  return (
    <main className="study-page account-page">
      <header className="study-page__header">
        <div><span className="study-page__eyebrow">Preferências</span><h1>Minha conta</h1><p>Mantenha seus dados, acesso e segurança organizados em um só lugar.</p></div>
        <button className="study-button study-button--quiet" onClick={() => setTela("modulos")}><StudyIcon name="home" size={15} /> Voltar ao início</button>
      </header>

      <div className="account-layout">
        <aside className="account-plan">
          <span className="account-plan__icon"><StudyIcon name="user" size={22} /></span>
          <span className="study-page__eyebrow">Seu acesso</span>
          <h2>{nomePlano()}</h2>
          <p className={ativo ? "is-active" : ""}><i /> {ativo ? "Plano ativo" : "Plano inativo"}</p>
          {tempoRestante && tempoRestante !== "Expirado" && <div className="account-plan__time"><StudyIcon name="clock" size={16} /><span><small>Tempo restante</small><strong>{tempoRestante}</strong></span></div>}
          {estaEmTeste && <a href={gerarLinkWhatsApp()} target="_blank" rel="noopener noreferrer">Cancelar teste ou pedir reembolso</a>}
        </aside>

        <section className="account-settings">
          <div className="account-section-heading"><div><span>Dados pessoais</span><h2>Informações da conta</h2></div><StudyIcon name="user" size={20} /></div>
          <div className="account-form">
            <label><span>Nome completo</span><input type="text" value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} placeholder="Nome completo" /></label>
            <label><span>Endereço</span><input type="text" value={dados.endereco} onChange={(e) => setDados({ ...dados, endereco: e.target.value })} placeholder="Endereço" /></label>
            <label><span>CPF</span><input type="text" value={dados.cpf} disabled /></label>
            <label><span>Data de nascimento</span><input type="date" value={dados.nascimento} onChange={(e) => setDados({ ...dados, nascimento: e.target.value })} /></label>
            <label className="account-form__wide"><span>E-mail</span><input type="email" value={dados.email} disabled /></label>
          </div>
          <button className="study-button study-button--primary account-save" onClick={handleSalvar}><StudyIcon name="save" size={15} /> Salvar alterações</button>

          <div className="account-security">
            <div className="account-section-heading"><div><span>Segurança</span><h2>Trocar senha</h2></div><StudyIcon name="settings" size={20} /></div>
            <div className="account-security__form"><label><span>Nova senha</span><input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" /></label><button className="study-button study-button--quiet" onClick={handleTrocarSenha}>Atualizar senha</button></div>
          </div>
          {mensagem && <div className="account-message">{mensagem}</div>}
        </section>
      </div>
    </main>
  );
}
