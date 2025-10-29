import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const form = document.getElementById("chamado-form");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeUsuario = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const departamento = document.getElementById("departamento").value;
  const descricao = document.getElementById("descricao").value;
  const prioridade = document.getElementById("prioridade").value;

  try {
    await addDoc(collection(db, "chamados"), {
      nomeUsuario,
      email,
      departamento,
      descricao,
      prioridade,
      status: "Pendente",
      criadoEm: serverTimestamp()
    });

    mensagem.textContent = "✅ Chamado enviado com sucesso!";
    mensagem.style.color = "#00c853";
    form.reset();
  } catch (error) {
    console.error("Erro ao enviar chamado:", error);
    mensagem.textContent = "❌ Erro ao enviar o chamado. Verifique o console.";
    mensagem.style.color = "red";
  }
});
