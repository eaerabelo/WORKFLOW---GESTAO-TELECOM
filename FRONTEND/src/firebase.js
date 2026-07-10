// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFZvBcVkrHrxSLKrdbaNB_ZIUFFw8BYLs",
  authDomain: "painel-vendas.firebaseapp.com",
  databaseURL: "https://painel-vendas-default-rtdb.firebaseio.com",
  projectId: "painel-vendas",
  storageBucket: "painel-vendas.firebasestorage.app",
  messagingSenderId: "767795934244",
  appId: "1:767795934244:web:bd50663666a474101854b1",
  measurementId: "G-3D0GQ79KK5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Somente inicializa o Analytics no navegador (evita erros em SSR ou ambientes sem window)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
