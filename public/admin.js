import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
  getFirestore, collection, onSnapshot, doc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const logoutBtn = document.getElementById("logout-btn");
const chamadosBody = document.getElementById("chamados-body");
const listaAbertos = document.getElementById("lista-abertos");

let graficoStatus, graficoRecentes;

// 🔒 Verifica login
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
  else carregarChamados();
});

// 🚪 Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "login.html"));
});

// 📋 Carregar chamados
function carregarChamados() {
  const chamadosRef = collection(db, "chamados");

  onSnapshot(chamadosRef, (snapshot) => {
    chamadosBody.innerHTML = "";
    listaAbertos.innerHTML = "";

    let total = 0, abertos = 0, andamento = 0, finalizados = 0;
    let ultimos7 = 0, ultimos30 = 0;
    const agora = new Date();
    const seteDiasAtras = new Date(agora);
    seteDiasAtras.setDate(agora.getDate() - 7);
    const trintaDiasAtras = new Date(agora);
    trintaDiasAtras.setDate(agora.getDate() - 30);

    snapshot.forEach((docSnap) => {
      const chamado = docSnap.data();
      const id = docSnap.id;
      total++;

      switch (chamado.status) {
        case "Finalizado": finalizados++; break;
        case "Em andamento": andamento++; break;
        default: abertos++;
      }

      if (chamado.criadoEm?.toDate) {
        const data = chamado.criadoEm.toDate();
        if (data >= seteDiasAtras) ultimos7++;
        if (data >= trintaDiasAtras) ultimos30++;
      }

      // 🔹 Pendentes e em andamento
      if (chamado.status !== "Finalizado") {
        const dataCriacao = chamado.criadoEm?.toDate
          ? chamado.criadoEm.toDate().toLocaleString("pt-BR")
          : "—";

        const li = document.createElement("li");
        li.innerHTML = `
          <div class="chamado-item">
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>Usuário:</strong> ${chamado.nomeUsuario || "Anônimo"}</p>
            <p><strong>Departamento:</strong> ${chamado.departamento || "Não informado"}</p>
            <p><strong>Descrição do Problema:</strong></p>
            <p class="descricao-texto">${chamado.descricao || "Sem descrição"}</p>
            <p><strong>Prioridade:</strong> ${chamado.prioridade || "N/A"}</p>
            <p><strong>Status:</strong> ${chamado.status || "Pendente"}</p>
            <p><strong>Criado em:</strong> ${dataCriacao}</p>
            <div class="acoes">
              <button class="btn-acao andamento" onclick="atualizarStatus('${id}', 'Em andamento')">Em andamento</button>
              <button class="btn-acao finalizar" onclick="atualizarStatus('${id}', 'Finalizado')">Finalizar</button>
            </div>
          </div>
        `;
        listaAbertos.appendChild(li);
      }

      // 🔹 Finalizados
      if (chamado.status === "Finalizado") {
        const criadoEm = chamado.criadoEm?.toDate
          ? chamado.criadoEm.toDate().toLocaleString("pt-BR")
          : "—";

        const finalizadoEm = chamado.finalizadoEm?.toDate
          ? chamado.finalizadoEm.toDate().toLocaleString("pt-BR")
          : "—";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${id}</td>
          <td>${chamado.nomeUsuario || "Anônimo"}</td>
          <td>${chamado.departamento || "Não informado"}</td>
          <td>${chamado.descricao || "Sem descrição"}</td>
          <td>${chamado.prioridade || "N/A"}</td>
          <td>${chamado.status}</td>
          <td>${criadoEm}</td>
          <td>${finalizadoEm}</td>
        `;
        chamadosBody.appendChild(row);
      }
    });

    document.getElementById("total-chamados").textContent = total;
    document.getElementById("abertos").textContent = abertos;
    document.getElementById("andamento").textContent = andamento;
    document.getElementById("finalizados").textContent = finalizados;

    atualizarGraficos({ abertos, andamento, finalizados, ultimos7, ultimos30 });
  });
}

// ✏️ Atualiza status e registra data da finalização
window.atualizarStatus = async function (id, novoStatus) {
  const chamadoRef = doc(db, "chamados", id);
  const atualizacao = { status: novoStatus };

  if (novoStatus === "Finalizado") {
    atualizacao.finalizadoEm = serverTimestamp();
  }

  await updateDoc(chamadoRef, atualizacao);
  alert(`Status atualizado para: ${novoStatus}`);
};

// 📊 Gráficos
function atualizarGraficos({ abertos, andamento, finalizados, ultimos7, ultimos30 }) {
  const ctx1 = document.getElementById("graficoStatus").getContext("2d");
  const ctx2 = document.getElementById("graficoRecentes").getContext("2d");
  if (graficoStatus) graficoStatus.destroy();
  if (graficoRecentes) graficoRecentes.destroy();

  graficoStatus = new Chart(ctx1, {
    type: "pie",
    data: {
      labels: ["Pendentes", "Em andamento", "Finalizados"],
      datasets: [{ data: [abertos, andamento, finalizados], backgroundColor: ["#ff5252", "#ffb300", "#00c853"] }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  graficoRecentes = new Chart(ctx2, {
    type: "pie",
    data: {
      labels: ["Últimos 7 dias", "Últimos 30 dias"],
      datasets: [{ data: [ultimos7, ultimos30], backgroundColor: ["#2979ff", "#64b5f6"] }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}
