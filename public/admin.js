import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
  getFirestore, collection, onSnapshot, doc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// 🔥 Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Elementos da interface
const logoutBtn = document.getElementById("logout-btn");
const chamadosBody = document.getElementById("chamados-body");
const listaAbertos = document.getElementById("lista-abertos");

// 🔹 Variáveis de gráfico
let graficoStatus, graficoRecentes, graficoSetores30, graficoSetores365;

// 🔒 Verifica login
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
  else carregarChamados();
});

// 🚪 Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "index.html"));
});

// 📋 Carregar chamados + dados para gráficos
function carregarChamados() {
  const chamadosRef = collection(db, "chamados");
    // 🔹 Atualiza o número do último chamado registrado
  async function atualizarUltimoChamado() {
    const q = query(chamadosRef, orderBy("numeroIndex", "desc"), limit(1));
    const snapshot = await getDocs(q);

    const ultimoElem = document.getElementById("ultimo-chamado");

    if (snapshot.empty) {
      ultimoElem.textContent = "Nenhum chamado registrado ainda.";
    } else {
      const ultimoChamado = snapshot.docs[0].data();
      ultimoElem.textContent = `🔢 Último chamado registrado: ${ultimoChamado.numeroChamado}`;
    }
  }

// Chama logo no início do carregamento
atualizarUltimoChamado();

  onSnapshot(chamadosRef, (snapshot) => {
    chamadosBody.innerHTML = "";
    listaAbertos.innerHTML = "";

    let total = 0, abertos = 0, andamento = 0, finalizados = 0;
    let ultimos30 = 0, ultimos365 = 0;

    const agora = new Date();
    const trintaDiasAtras = new Date(agora);
    trintaDiasAtras.setDate(agora.getDate() - 30);
    const anoAtras = new Date(agora);
    anoAtras.setDate(agora.getDate() - 365);

    // 🔹 Contagem por setor
    const setores30 = {};
    const setores365 = {};

    snapshot.forEach((docSnap) => {
      const chamado = docSnap.data();
      const id = docSnap.id;
      total++;

      // Contagem por status
      switch (chamado.status) {
        case "Finalizado": finalizados++; break;
        case "Em andamento": andamento++; break;
        default: abertos++;
      }

      // 📅 Datas
      if (chamado.criadoEm?.toDate) {
        const data = chamado.criadoEm.toDate();

        // Últimos 30 dias
        if (data >= trintaDiasAtras) {
          ultimos30++;
          const depto = chamado.departamento || "Não informado";
          setores30[depto] = (setores30[depto] || 0) + 1;
        }

        // Últimos 365 dias
        if (data >= anoAtras) {
          ultimos365++;
          const depto = chamado.departamento || "Não informado";
          setores365[depto] = (setores365[depto] || 0) + 1;
        }
      }

      // 🔹 Pendentes e em andamento
      if (chamado.status !== "Finalizado") {
        const dataCriacao = chamado.criadoEm?.toDate
          ? chamado.criadoEm.toDate().toLocaleString("pt-BR")
          : "—";

        const li = document.createElement("li");
        li.innerHTML = `
          <div class="chamado-item">
            <p><strong>Nº Chamado:</strong> ${chamado.numeroChamado || "—"}</p>
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

        const dataFinalizacao = chamado.finalizadoEm?.toDate
          ? chamado.finalizadoEm.toDate().toLocaleString("pt-BR")
          : "—";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${chamado.numeroChamado || "—"}</td>
          <td>${id}</td>
          <td>${chamado.nomeUsuario || "Anônimo"}</td>
          <td>${chamado.departamento || "Não informado"}</td>
          <td>${chamado.descricao || "Sem descrição"}</td>
          <td>${chamado.prioridade || "N/A"}</td>
          <td>${chamado.status}</td>
          <td>${criadoEm}</td>
          <td>${dataFinalizacao}</td>
          <td>${chamado.motivoFinalizacao || "—"}</td>
        `;
        chamadosBody.appendChild(row);
      }
    });

    // Atualiza totais
    document.getElementById("total-chamados").textContent = total;
    document.getElementById("abertos").textContent = abertos;
    document.getElementById("andamento").textContent = andamento;
    document.getElementById("finalizados").textContent = finalizados;

    // Atualiza gráficos
    atualizarGraficos({ abertos, andamento, finalizados, ultimos30, ultimos365, setores30, setores365 });
  });
}

// ✏️ Atualiza status (com mensagem de finalização)
window.atualizarStatus = async function (id, novoStatus) {
  const chamadoRef = doc(db, "chamados", id);

  const atualizacao = { status: novoStatus };

  // Se o chamado for finalizado, solicita o motivo e registra a data
  if (novoStatus === "Finalizado") {
    const motivo = prompt("Digite uma breve descrição do que foi feito para resolver o chamado:");
    if (!motivo || motivo.trim() === "") {
      alert("A finalização foi cancelada — o motivo é obrigatório.");
      return;
    }

    atualizacao.motivoFinalizacao = motivo.trim();
    atualizacao.finalizadoEm = serverTimestamp();
  }

  await updateDoc(chamadoRef, atualizacao);
  alert(`Status atualizado para: ${novoStatus}`);
};

// 📊 Gráficos
function atualizarGraficos({ abertos, andamento, finalizados, ultimos30, ultimos365, setores30, setores365 }) {
  const ctx1 = document.getElementById("graficoStatus").getContext("2d");
  const ctx2 = document.getElementById("graficoRecentes").getContext("2d");
  const ctx3 = document.getElementById("graficoSetores30").getContext("2d");
  const ctx4 = document.getElementById("graficoSetores365").getContext("2d");

  if (graficoStatus) graficoStatus.destroy();
  if (graficoRecentes) graficoRecentes.destroy();
  if (graficoSetores30) graficoSetores30.destroy();
  if (graficoSetores365) graficoSetores365.destroy();

  // Status geral
  graficoStatus = new Chart(ctx1, {
    type: "pie",
    data: {
      labels: ["Pendentes", "Em andamento", "Finalizados"],
      datasets: [{ data: [abertos, andamento, finalizados], backgroundColor: ["#ff5252", "#ffb300", "#00c853"] }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  // Chamados recentes
  graficoRecentes = new Chart(ctx2, {
    type: "pie",
    data: {
      labels: ["Últimos 30 dias", "Últimos 365 dias"],
      datasets: [{ data: [ultimos30, ultimos365], backgroundColor: ["#2979ff", "#64b5f6"] }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  // Por setor (30 dias)
  const setoresLabels30 = Object.keys(setores30);
  const setoresData30 = Object.values(setores30);
  const cores30 = setoresLabels30.map(() => `hsl(${Math.random() * 360}, 70%, 55%)`);

  graficoSetores30 = new Chart(ctx3, {
    type: "pie",
    data: {
      labels: setoresLabels30,
      datasets: [{ data: setoresData30, backgroundColor: cores30 }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  // Por setor (365 dias)
  const setoresLabels365 = Object.keys(setores365);
  const setoresData365 = Object.values(setores365);
  const cores365 = setoresLabels365.map(() => `hsl(${Math.random() * 360}, 70%, 55%)`);

  graficoSetores365 = new Chart(ctx4, {
    type: "pie",
    data: {
      labels: setoresLabels365,
      datasets: [{ data: setoresData365, backgroundColor: cores365 }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}
