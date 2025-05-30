import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "antiprocastinador.firebaseapp.com",
  projectId: "antiprocastinador",
  storageBucket: "antiprocastinador.appspot.com",
  messagingSenderId: "176220550517",
  appId: "1:176220550517:web:d933bbe5054dd1e1444f3c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
