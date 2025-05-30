import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHfn93lYERRYoorFIF_hh4nQYTElKDmfg",
  authDomain: "antiprocastinador.firebaseapp.com",
  projectId: "antiprocastinador",
  storageBucket: "antiprocastinador.appspot.com", // <-- CORRIGIDO AQUI!
  messagingSenderId: "176220550517",
  appId: "1:176220550517:web:d933bbe5054dd1e1444f3c",
  measurementId: "G-3R7YRFXR59"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta autenticação e banco de dados para uso no app
export const auth = getAuth(app);
export const db = getFirestore(app);
