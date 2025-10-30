import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const form = document.getElementById("chamado-form");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeUsuario = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const departamento = document.getElementById("departamento").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const prioridade = document.getElementById("prioridade").value;

  mensagem.className = "";
  mensagem.style.opacity = "0";

  if (!nomeUsuario || !email || !departamento || !descricao || !prioridade) {
    mensagem.textContent = "⚠️ Por favor, preencha todos os campos obrigatórios.";
    mensagem.classList.add("alerta");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "chamados"), {
      nomeUsuario,
      email,
      departamento,
      descricao,
      prioridade,
      status: "Pendente",
      criadoEm: serverTimestamp()
    });

    mensagem.innerHTML = `
      ✅ Chamado enviado com sucesso!<br>
      <strong>ID do chamado:</strong> <span id="chamado-id">${docRef.id}</span>
      <button id="copiar-id" class="btn-copiar">Copiar ID</button>
    `;
    mensagem.classList.add("sucesso");

    form.reset();

    // Botão de copiar ID
    const copiarBtn = document.getElementById("copiar-id");
    copiarBtn.addEventListener("click", async () => {
      const idTexto = document.getElementById("chamado-id").textContent;
      try {
        await navigator.clipboard.writeText(idTexto);
        copiarBtn.textContent = "✅ Copiado!";
        copiarBtn.classList.add("copiado");
        setTimeout(() => {
          copiarBtn.textContent = "Copiar ID";
          copiarBtn.classList.remove("copiado");
        }, 2000);
      } catch (err) {
        console.error("Erro ao copiar ID:", err);
        copiarBtn.textContent = "❌ Erro ao copiar";
      }
    });

  } catch (error) {
    console.error("Erro ao enviar chamado:", error);
    mensagem.textContent = "❌ Erro ao enviar o chamado. Tente novamente.";
    mensagem.classList.add("erro");
  }

  setTimeout(() => {
    mensagem.style.opacity = "1";
  }, 100);
});
