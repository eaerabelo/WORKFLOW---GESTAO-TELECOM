import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração oficial do seu banco de dados Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDFZvBcVkrHrxSLKrdbaNB_ZIUFFw8BYLs",
    authDomain: "painel-claro.firebaseapp.com",
    databaseURL: "https://painel-claro-default-rtdb.firebaseio.com",
    projectId: "painel-claro",
    storageBucket: "painel-claro.firebasestorage.app",
    messagingSenderId: "767795934244",
    appId: "1:767795934244:web:1d6d6e116ceed6aa1854b1",
    measurementId: "G-9GP7WSXPKC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);