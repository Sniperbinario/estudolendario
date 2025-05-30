import React, { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function LoginRegister({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState("login"); // "login" ou "cadastro"
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      if (modo === "login") {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        onLogin(userCredential.user); // passa o usuário logado pro App.jsx
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        onLogin(userCredential.user);
      }
    } catch (error) {
      setErro(error.message.replace("Firebase:", ""));
    }
    setCarregando(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-xs flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center">
          {modo === "login" ? "Entrar" : "Criar Conta"}
        </h2>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          required
          minLength={6}
          onChange={(e) => setSenha(e.target.value)}
          className="p-2 rounded bg-gray-700 border border-gray-600"
        />
        {erro && <div className="text-red-400 text-sm">{erro}</div>}
        <button
          type="submit"
          disabled={carregando}
          className="bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold"
        >
          {carregando ? "Carregando..." : (modo === "login" ? "Entrar" : "Cadastrar")}
        </button>
        <div className="text-sm text-center mt-2">
          {modo === "login" ? (
            <>
              Não tem conta?{" "}
              <button
                type="button"
                className="text-blue-400 underline"
                onClick={() => setModo("cadastro")}
              >
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                className="text-blue-400 underline"
                onClick={() => setModo("login")}
              >
                Entrar
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
