const PROJECT_CONFIG = {
  group: "09",
  className: "3E",
  members: ["Nome 1", "Nome 2", "Nome 3"],
  topics: {
    temperature: "aulas/professor/temperatura",
    humidity: "aulas/professor/umidade",
    air: "aulas/professor/qualidade_ar",
  },
};
const KEYS = { password: "iotGrupoSenha", config: "iotDashboardConfig" };
const state = {
  client: null,
  demo: null,
  index: 0,
  readings: { temperature: null, humidity: null, air: null },
};
const $ = (s) => document.querySelector(s);
function identity() {
  $("#header-group").textContent =
    `GRUPO ${PROJECT_CONFIG.group} · TURMA ${PROJECT_CONFIG.className}`;
  $("#banner-group").textContent = `Grupo ${PROJECT_CONFIG.group}`;
  $("#footer-members").textContent = PROJECT_CONFIG.members.join(" · ");
}
function showView(name) {
  document
    .querySelectorAll("[data-view]")
    .forEach((e) => e.classList.toggle("active", e.dataset.view === name));
  $("#view-sobre").hidden = name !== "sobre";
  $("#view-dashboard").hidden = name !== "dashboard";
  history.replaceState(null, "", `#${name}`);
  $("#nav").classList.remove("open");
}
function time() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function status(connected, label = connected ? "Conectado" : "Desconectado") {
  $("#connection").classList.toggle("connected", connected);
  $("#connection-label").textContent = label;
  $("#connect-button").textContent = connected ? "Desconectar" : "Conectar";
  $("#broker-health").textContent = connected ? "Online" : "Offline";
}
function metric(kind, value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return;
  state.readings[kind] = n;
  const c = {
      temperature: {
        v: "#temperature-value",
        s: "#temperature-state",
        b: "#temperature-bar",
        limit: 28,
        max: 45,
      },
      humidity: {
        v: "#humidity-value",
        s: "#humidity-state",
        b: "#humidity-bar",
        limit: 56,
        max: 100,
      },
      air: {
        v: "#air-value",
        s: "#air-state",
        b: "#air-bar",
        limit: 400,
        max: 800,
      },
    }[kind],
    alert = n > c.limit;
  $(c.v).textContent = Number.isInteger(n) ? n : n.toFixed(1);
  $(c.s).textContent = alert ? "Alerta" : "Normal";
  $(c.s).classList.toggle("alert", alert);
  $(c.b).style.width = `${Math.min((n / c.max) * 100, 100)}%`;
  $("#last-update").textContent = `Ultima leitura: ${time()}`;
  $("#message-health").textContent = time();
  $("#alert-health").textContent = Object.entries(state.readings).filter(
    ([k, v]) =>
      v !== null && v > { temperature: 28, humidity: 56, air: 400 }[k],
  ).length;
  eventRow(kind, n, alert);
}
function eventRow(kind, value, alert) {
  const labels = {
      temperature: "Temperatura",
      humidity: "Umidade",
      air: "Qualidade do ar",
    },
    list = $("#event-list");
  list.querySelector(".empty")?.remove();
  const row = document.createElement("p");
  row.className = alert ? "alert" : "";
  row.innerHTML = `<time>${time()}</time><strong>${labels[kind]} atualizada</strong><span>${value}${kind === "temperature" ? " °C" : kind === "humidity" ? " %" : " ppm"}</span>`;
  list.prepend(row);
  while (list.children.length > 5) list.lastElementChild.remove();
}
function connect() {
  if (typeof Paho === "undefined") {
    status(false, "Biblioteca indisponivel");
    return;
  }
  const host = $("#broker-host").value.trim() || "localhost",
    port = Number($("#broker-port").value) || 9001;
  state.client = new Paho.MQTT.Client(
    host,
    port,
    `dashboard-${PROJECT_CONFIG.group}-${Date.now()}`,
  );
  state.client.onConnectionLost = () => status(false);
  state.client.onMessageArrived = (m) => {
    const map = {
        [PROJECT_CONFIG.topics.temperature]: "temperature",
        [PROJECT_CONFIG.topics.humidity]: "humidity",
        [PROJECT_CONFIG.topics.air]: "air",
      },
      kind = map[m.destinationName];
    if (kind) metric(kind, m.payloadString);
  };
  status(false, "Conectando...");
  state.client.connect({
    useSSL: false,
    timeout: 5,
    onSuccess: () => {
      status(true);
      Object.values(PROJECT_CONFIG.topics).forEach((t) =>
        state.client.subscribe(t),
      );
    },
    onFailure: () => status(false, "Falha na conexao"),
  });
}
function disconnect() {
  if (state.client?.isConnected()) state.client.disconnect();
  status(false);
}
function demo() {
  const button = $("#demo-button");
  if (state.demo) {
    clearInterval(state.demo);
    state.demo = null;
    button.textContent = "Iniciar demonstracao";
    return;
  }
  const samples = [
      { temperature: 26.8, humidity: 51, air: 296 },
      { temperature: 29.2, humidity: 58, air: 421 },
      { temperature: 27.4, humidity: 54, air: 344 },
    ],
    tick = () =>
      Object.entries(samples[state.index++ % samples.length]).forEach(
        ([k, v]) => metric(k, v),
      );
  button.textContent = "Parar demonstracao";
  tick();
  state.demo = setInterval(tick, 3000);
}
document.addEventListener("DOMContentLoaded", () => {
  identity();
  try {
    const c = JSON.parse(localStorage.getItem(KEYS.config) || "{}");
    if (c.host) $("#broker-host").value = c.host;
    if (c.port) $("#broker-port").value = c.port;
  } catch (e) {}
  showView(location.hash === "#dashboard" ? "dashboard" : "sobre");
  document.querySelectorAll("[data-view]").forEach((e) =>
    e.addEventListener("click", (x) => {
      x.preventDefault();
      showView(e.dataset.view);
    }),
  );
  $("#menu-toggle").onclick = () => $("#nav").classList.toggle("open");
  $("#open-settings").onclick = () => $("#settings-dialog").showModal();
  $("#connect-button").onclick = () =>
    state.client?.isConnected() ? disconnect() : connect();
  $("#demo-button").onclick = demo;
  $("#settings-form").onsubmit = (e) => {
    e.preventDefault();
    localStorage.setItem(KEYS.password, $("#group-password").value);
    localStorage.setItem(
      KEYS.config,
      JSON.stringify({
        host: $("#broker-host").value,
        port: Number($("#broker-port").value),
      }),
    );
    $("#settings-dialog").close();
  };
});
