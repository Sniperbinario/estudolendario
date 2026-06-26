import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

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

// Messaging só funciona em contextos que suportam SW
export const messaging = await isSupported().then(yes => yes ? getMessaging(app) : null).catch(() => null);
