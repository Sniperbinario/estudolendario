import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHfn93lYERRYoorFIF_hh4nQYTElKDmfg",
  authDomain: "antiprocastinador.firebaseapp.com",
  projectId: "antiprocastinador",
  databaseURL: "https://antiprocastinador-default-rtdb.firebaseio.com",
  storageBucket: "antiprocastinador.appspot.com",
  messagingSenderId: "176220550517",
  appId: "1:176220550517:web:d933bbe5054dd1e1444f3c",
  measurementId: "G-3R7YRFXR59"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
