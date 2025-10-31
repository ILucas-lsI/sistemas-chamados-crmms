import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const form = document.getElementById("login-form");
const mensagem = document.getElementById("mensagem");

// Lista de e-mails administrativos (restrita)
const adminEmails = ["suporte@crmms.org.br"];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    mensagem.textContent = "Login realizado com sucesso!";
  } catch (erro) {
    mensagem.textContent = "Erro ao fazer login. Verifique suas credenciais.";
    console.error("Erro de login:", erro);
  }
});

// Redireciona após login bem-sucedido
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (adminEmails.includes(user.email)) {
      window.location.href = "admin.html"; // Admin → painel
    } else {
      window.location.href = "form.html"; // Usuário comum → criação de chamados
    }
  }
});
