// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAugDf-_-ITQP_kNusdo970d0eRIZml2s0",
  authDomain: "sistemas-chamdos-ti.firebaseapp.com",
  databaseURL: "https://sistemas-chamdos-ti-default-rtdb.firebaseio.com",
  projectId: "sistemas-chamdos-ti",
  storageBucket: "sistemas-chamdos-ti.firebasestorage.app",
  messagingSenderId: "187643483597",
  appId: "1:187643483597:web:df77406815ec1354b52084"
};

// 🔥 Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🟢 Exporta corretamente
export { app, db, auth, firebaseConfig };