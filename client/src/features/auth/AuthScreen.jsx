import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import RecuperarSenha from "../../RecuperarSenha";
import { Brand } from "../marketing/components/Brand";
import { Icon } from "../marketing/components/Icon";

function validateCPF(value) {
  const cpf = value.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const digit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function formatCPF(value) {
  return value.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function friendlyError(error) {
  const code = error?.code || "";
  if (code.includes("invalid-credential")) return "E-mail ou senha incorretos.";
  if (code.includes("email-already-in-use")) return "Este e-mail já possui uma conta.";
  if (code.includes("weak-password")) return "Use uma senha com pelo menos 6 caracteres.";
  if (code.includes("invalid-email")) return "Digite um e-mail válido.";
  return "Não foi possível concluir. Revise os dados e tente novamente.";
}

function Field({ label, ...props }) {
  return <label className="auth-field"><span>{label}</span><input {...props} /></label>;
}

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", zip: "", address: "", cpf: "", birthDate: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const registering = mode === "register";

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const lookupAddress = async () => {
    const zip = form.zip.replace(/\D/g, "");
    if (!zip) return;
    if (zip.length !== 8) return setError("Digite um CEP com 8 números.");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const data = await response.json();
      if (data.erro) return setError("CEP não encontrado.");
      setForm((current) => ({ ...current, address: `${data.logradouro}, ${data.bairro} — ${data.localidade}/${data.uf}` }));
      setError("");
    } catch {
      setError("Não foi possível consultar o CEP agora.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!registering) {
        const credential = await signInWithEmailAndPassword(auth, form.email, form.password);
        onLogin(credential.user);
      } else {
        if (!form.name || !form.address || !form.cpf || !form.birthDate) throw new Error("missing-profile");
        if (!validateCPF(form.cpf)) return setError("CPF inválido."), setLoading(false);
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "users", credential.user.uid), {
          nome: form.name, endereco: form.address, cpf: form.cpf, nascimento: form.birthDate,
          email: form.email, criadoEm: new Date().toISOString(),
        });
        onLogin(credential.user);
      }
    } catch (submissionError) {
      setError(submissionError.message === "missing-profile" ? "Preencha todos os campos obrigatórios." : friendlyError(submissionError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <a href="#/" className="auth-page__brand"><Brand /></a>
      <section className="auth-story">
        <span className="eyebrow">Sua preparação continua aqui</span>
        <h1>Clareza para estudar hoje. Histórico para evoluir amanhã.</h1>
        <p>Entre para acessar seu edital, sua agenda e tudo o que já construiu na plataforma.</p>
        <div className="auth-story__preview">
          <div className="auth-story__head"><span>Progresso desta semana</span><strong>72%</strong></div>
          <div className="auth-story__bar"><span /></div>
          <div className="auth-story__stats"><span><strong>5h 40min</strong> estudadas</span><span><strong>184</strong> questões</span><span><strong>81%</strong> de acerto</span></div>
        </div>
        <ul>
          <li><Icon name="check" size={17} /> Seu histórico fica salvo por edital</li>
          <li><Icon name="check" size={17} /> Retome exatamente de onde parou</li>
          <li><Icon name="check" size={17} /> Seus dados protegidos pelo Firebase</li>
        </ul>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__heading">
          <span className="auth-panel__kicker">{registering ? "Comece seu teste gratuito" : "Bem-vindo de volta"}</span>
          <h2>{registering ? "Crie sua conta" : "Acesse sua conta"}</h2>
          <p>{registering ? "Monte seu primeiro plano de estudos em poucos minutos." : "Use os dados cadastrados para continuar."}</p>
        </div>
        <div className="auth-tabs" role="tablist">
          <button className={!registering ? "is-active" : ""} onClick={() => { setMode("login"); setError(""); }} type="button">Entrar</button>
          <button className={registering ? "is-active" : ""} onClick={() => { setMode("register"); setError(""); }} type="button">Criar conta</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {registering && <>
            <Field label="Nome completo" type="text" value={form.name} onChange={update("name")} autoComplete="name" required />
            <div className="auth-form__row">
              <Field label="CEP" type="text" inputMode="numeric" value={form.zip} onChange={update("zip")} onBlur={lookupAddress} maxLength={9} required />
              <Field label="Data de nascimento" type="date" value={form.birthDate} onChange={update("birthDate")} required />
            </div>
            <Field label="Endereço" type="text" value={form.address} onChange={update("address")} autoComplete="street-address" required />
            <Field label="CPF" type="text" inputMode="numeric" value={form.cpf} onChange={(event) => setForm((current) => ({ ...current, cpf: formatCPF(event.target.value) }))} maxLength={14} required />
          </>}
          <Field label="E-mail" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
          <Field label="Senha" type="password" value={form.password} onChange={update("password")} autoComplete={registering ? "new-password" : "current-password"} minLength={6} required />
          {!registering && <button className="auth-form__recovery" type="button" onClick={() => setShowRecovery(true)}>Esqueci minha senha</button>}
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <button className="button button--primary auth-form__submit" disabled={loading} type="submit">{loading ? "Aguarde…" : registering ? "Criar conta gratuita" : "Entrar na plataforma"}<Icon name="arrow" /></button>
        </form>
        <p className="auth-panel__foot">Ao continuar, você concorda com os termos de uso e a política de privacidade.</p>
      </section>
      {showRecovery && <RecuperarSenha fechar={() => setShowRecovery(false)} />}
    </main>
  );
}
