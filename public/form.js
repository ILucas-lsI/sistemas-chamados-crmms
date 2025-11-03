import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const listaChamados = document.getElementById("lista-meus-chamados");
const logoutBtn = document.getElementById("logoutbtn");
const form = document.getElementById("chamado-form");
const mensagem = document.getElementById("mensagem");
const emailInput = document.getElementById("email");

let emailUsuarioLogado = null;

// 🚪 Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "index.html"));
});

// 🔒 Verifica autenticação
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.warn("Usuário não autenticado — redirecionando...");
    window.location.href = "index.html";
  } else {
    console.log("Usuário autenticado:", user.email);
    emailUsuarioLogado = user.email;

    // Preenche automaticamente o campo de e-mail e bloqueia edição
    if (emailInput) {
      emailInput.value = emailUsuarioLogado;
      emailInput.readOnly = true;
      emailInput.style.backgroundColor = "#2e3440";
      emailInput.style.cursor = "not-allowed";
    }

    carregarChamadosUsuario(user.email);
  }
});

// 📋 Exibe apenas os chamados do usuário logado
function carregarChamadosUsuario(emailUsuario) {
  const chamadosRef = collection(db, "chamados");
  const q = query(chamadosRef, where("email", "==", emailUsuario));

  onSnapshot(q, (snapshot) => {
    listaChamados.innerHTML = "";

    if (snapshot.empty) {
      listaChamados.innerHTML = "<li>Você ainda não abriu nenhum chamado.</li>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const chamado = docSnap.data();
      const id = docSnap.id;
      const dataCriacao = chamado.criadoEm?.toDate
        ? chamado.criadoEm.toDate().toLocaleString("pt-BR")
        : "—";

      const li = document.createElement("li");
      li.classList.add("chamado-item-usuario");

      li.innerHTML = `
        <div>
          <p><strong>ID:</strong> ${id}</p>
          <p><strong>Descrição:</strong> ${chamado.descricao || "Sem descrição"}</p>
          <p><strong>Status:</strong> 
            <span class="status-${(chamado.status || "Pendente").toLowerCase()}">
              ${chamado.status || "Pendente"}
            </span>
          </p>
          <p><strong>Data:</strong> ${dataCriacao}</p>
        </div>
      `;
      listaChamados.appendChild(li);
    });
  }, (error) => {
    console.error("Erro ao carregar chamados:", error);
    listaChamados.innerHTML = "<li>❌ Erro ao carregar seus chamados.</li>";
  });
}

// 📤 Envia novo chamado
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    mensagem.textContent = "⚠️ É necessário estar logado para abrir um chamado.";
    mensagem.classList.add("alerta");
    return;
  }

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

  // ⚠️ Verifica se o email é o mesmo do login
  if (emailUsuarioLogado && email !== emailUsuarioLogado) {
    mensagem.textContent = "❌ O e-mail deve ser o mesmo usado no login.";
    mensagem.classList.add("erro");
    mensagem.style.opacity = "1";
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
      criadoEm: serverTimestamp(),
    });

    mensagem.innerHTML = `
      ✅ Chamado enviado com sucesso!<br>
      <strong>ID do chamado:</strong> <span id="chamado-id">${docRef.id}</span>
      <button id="copiar-id" class="btn-copiar">📋 Copiar ID 📋</button>
    `;
    mensagem.classList.add("sucesso");
    form.reset();

    // Bloqueia o campo de e-mail novamente após reset
    emailInput.value = emailUsuarioLogado;
    emailInput.readOnly = true;

    const copiarBtn = document.getElementById("copiar-id");
    copiarBtn.addEventListener("click", async () => {
      const idTexto = document.getElementById("chamado-id").textContent;
      try {
        await navigator.clipboard.writeText(idTexto);
        copiarBtn.textContent = "✅ Copiado!";
        copiarBtn.classList.add("copiado");
        setTimeout(() => {
          copiarBtn.textContent = "📋 Copiar ID 📋";
          copiarBtn.classList.remove("copiado");
        }, 2000);
      } catch {
        copiarBtn.textContent = "❌ Erro ao copiar";
      }
    });

  } catch (error) {
    console.error("Erro ao enviar chamado:", error);
    mensagem.textContent = "❌ Erro ao enviar o chamado. Tente novamente.";
    mensagem.classList.add("erro");
  }

  setTimeout(() => (mensagem.style.opacity = "1"), 100);
});
