/* =========================================================
   DATAWATT — Lógica del sistema (portada desde DATAWATT.java)
   Todo en memoria, sin frameworks ni backend.
   ========================================================= */

/* ---------- CONSTANTES (equivalentes a los "static final") ---------- */
const MAX_EQUIPOS = 15;
const MAX_PERIODOS = 31;
const UMBRAL_DIA = 50;
const FACTOR_ALTO = 1.2;
const FACTOR_CRITICO = 1.5;
const FACTOR_BAJO = 0.7;

/* ---------- ESTADO GLOBAL (equivalente a los arrays "static") ----------
   Nota: en Java los arrays eran base 1 (índice 0 sin usar).
   Aquí se usan arrays base 0 y los bucles van de 0 a n-1.           */
const state = {
  numEquipos: 5,
  numPeriodos: 5,
  tarifa: 0.10,

  nombresEquipos: ["Iluminacion", "Aire acondicionado", "Laboratorios", "Oficinas", "Equipos de computo"],
  diasNombres: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
  idBinario: [],
  estado: [],
  consumo: [],          // consumo[i][j]
  totalEquipo: [],
  porcentaje: [],
  costoEquipo: [],
  clasificacion: [],
  tendencia: [],
  alerta: [],
  recomendacion: [],
  orden: [],

  totalGeneral: 0,
  promedioGeneral: 0,
  costoGeneral: 0,
  maxConsumo: 0,
  minConsumo: 0,
  posMax: 0,
  posMin: 0,
  contadorAlertas: 0,
  equiposEncendidos: 0,
  datosRegistrados: false
};

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */
function inicializarArrays() {
  state.idBinario = [];
  state.estado = [];
  state.consumo = [];
  state.totalEquipo = [];
  state.porcentaje = [];
  state.costoEquipo = [];
  state.clasificacion = [];
  state.tendencia = [];
  state.alerta = [];
  state.recomendacion = [];
  state.orden = [];

  for (let i = 0; i < state.numEquipos; i++) {
    state.idBinario[i] = convertirABinario(i + 1);
    state.estado[i] = "Apagado";
    state.consumo[i] = new Array(state.numPeriodos).fill(0);
    state.totalEquipo[i] = 0;
    state.porcentaje[i] = 0;
    state.costoEquipo[i] = 0;
    state.clasificacion[i] = "BAJO";
    state.tendencia[i] = "ESTABLE";
    state.alerta[i] = false;
    state.recomendacion[i] = "";
    state.orden[i] = i;
  }
}
inicializarArrays();

/* =========================================================
   FUNCIONES AUXILIARES (equivalentes a los métodos estáticos de Java)
   ========================================================= */

function convertirABinario(numero) {
  let n = numero;
  let bin = "";
  if (n === 0) {
    bin = "0";
  } else {
    while (n > 0) {
      const resto = n % 2;
      bin = String(resto) + bin;
      n = Math.floor(n / 2);
    }
  }
  return bin;
}

function money(valor) {
  return Number(valor).toFixed(2);
}

function clasificarConsumo(consumoEquipo, promedio) {
  const ratio = consumoEquipo / promedio;
  if (ratio >= FACTOR_CRITICO) return "CRITICO";
  if (ratio >= FACTOR_ALTO) return "ALTO";
  if (ratio >= FACTOR_BAJO) return "NORMAL";
  return "BAJO";
}

function calcularTendencia(valorInicial, valorFinal) {
  if (valorFinal > valorInicial) return "AUMENTO";
  if (valorFinal < valorInicial) return "DISMINUCION";
  return "ESTABLE";
}

function generarRecomendacion(nombre, porcentajeEquipo, clase, estadoEquipo) {
  let mensaje;
  const pct = money(porcentajeEquipo);
  if (clase === "CRITICO") {
    mensaje = `Revisar de inmediato ${nombre}: representa el ${pct}% del consumo total y esta en nivel CRITICO.`;
  } else if (clase === "ALTO") {
    mensaje = `Se recomienda reducir el tiempo de uso de ${nombre}, ya que su consumo representa el ${pct}% del total, por encima del promedio.`;
  } else if (clase === "BAJO") {
    mensaje = `${nombre} tiene un consumo BAJO (${pct}% del total); no requiere acciones.`;
  } else {
    mensaje = `${nombre} funciona en nivel NORMAL (${pct}% del total).`;
  }
  if (estadoEquipo === "Apagado") {
    mensaje += " (Actualmente apagado).";
  }
  return mensaje;
}

function ordenarRanking() {
  // Burbuja descendente, igual que en Java, pero sobre índices base 0
  const n = state.numEquipos;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (state.totalEquipo[state.orden[j]] < state.totalEquipo[state.orden[j + 1]]) {
        const temp = state.orden[j];
        state.orden[j] = state.orden[j + 1];
        state.orden[j + 1] = temp;
      }
    }
  }
}

/* =========================================================
   RECÁLCULO GENERAL (equivalente al bloque "if (requiereRecalculo)")
   ========================================================= */
function recalcularSistema() {
  state.totalGeneral = 0;
  state.contadorAlertas = 0;
  state.equiposEncendidos = 0;

  for (let i = 0; i < state.numEquipos; i++) {
    state.totalEquipo[i] = 0;
    for (let j = 0; j < state.numPeriodos; j++) {
      state.totalEquipo[i] += Number(state.consumo[i][j]) || 0;
    }
    state.totalGeneral += state.totalEquipo[i];
  }

  state.promedioGeneral = state.totalGeneral / state.numEquipos;

  state.maxConsumo = state.totalEquipo[0];
  state.minConsumo = state.totalEquipo[0];
  state.posMax = 0;
  state.posMin = 0;
  for (let i = 1; i < state.numEquipos; i++) {
    if (state.totalEquipo[i] > state.maxConsumo) { state.maxConsumo = state.totalEquipo[i]; state.posMax = i; }
    if (state.totalEquipo[i] < state.minConsumo) { state.minConsumo = state.totalEquipo[i]; state.posMin = i; }
  }

  for (let i = 0; i < state.numEquipos; i++) {
    state.porcentaje[i] = state.totalGeneral > 0 ? (state.totalEquipo[i] / state.totalGeneral) * 100 : 0;
    state.tendencia[i] = calcularTendencia(state.consumo[i][0], state.consumo[i][state.numPeriodos - 1]);
    state.costoEquipo[i] = state.totalEquipo[i] * state.tarifa;
  }

  state.costoGeneral = state.totalGeneral * state.tarifa;

  let promedioParaClasificar = state.promedioGeneral;
  if (promedioParaClasificar === 0) promedioParaClasificar = 0.0001;

  for (let i = 0; i < state.numEquipos; i++) {
    state.clasificacion[i] = clasificarConsumo(state.totalEquipo[i], promedioParaClasificar);
  }

  for (let i = 0; i < state.numEquipos; i++) {
    state.alerta[i] = false;
    if (state.estado[i] === "Encendido") state.equiposEncendidos++;
    if ((state.clasificacion[i] === "ALTO" || state.clasificacion[i] === "CRITICO") && state.estado[i] === "Encendido") {
      state.alerta[i] = true;
      state.contadorAlertas++;
    }
  }

  for (let i = 0; i < state.numEquipos; i++) {
    state.recomendacion[i] = generarRecomendacion(state.nombresEquipos[i], state.porcentaje[i], state.clasificacion[i], state.estado[i]);
  }

  ordenarRanking();
  renderAll();
}

/* =========================================================
   TOASTS (equivalente a los mensajes de consola con color)
   ========================================================= */
function toast(mensaje, tipo = "info") {
  const cont = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast ${tipo}`;
  el.textContent = mensaje;
  cont.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* =========================================================
   NAVEGACIÓN ENTRE SECCIONES
   ========================================================= */
const TITULOS = {
  dashboard: ["Panel general", "Vista rápida del consumo energético del sistema"],
  registrar: ["Registrar consumo semanal", "Ingresa el estado y consumo de cada equipo por periodo"],
  actualizar: ["Actualizar equipo específico", "Modifica el estado y consumo de un equipo puntual"],
  historial: ["Historial de consumos", "Consumo detallado por equipo y periodo"],
  estadistica: ["Estadística descriptiva general", "Totales, promedios y extremos del sistema"],
  procedimiento: ["Procedimiento matemático", "Fórmulas aplicadas paso a paso"],
  clasificacion: ["Clasificación automática y tendencia", "Nivel de consumo respecto al promedio"],
  ranking: ["Ranking de equipos por consumo", "De mayor a menor consumo total"],
  recomendaciones: ["Recomendaciones del sistema", "Sugerencias generadas automáticamente"],
  alertas: ["Alertas generadas", "Equipos encendidos en nivel Alto o Crítico"],
  simulacion: ["Modo simulación", "Genera datos aleatorios de prueba"],
  costo: ["Costo económico estimado", "Costo por equipo según la tarifa configurada"],
  exportar: ["Exportar reporte", "Descarga un reporte en formato TXT o CSV"],
  configuracion: ["Configuración del sistema", "Equipos, periodos y tarifa eléctrica"]
};

function irASeccion(nombre) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(`sec-${nombre}`).classList.add("active");

  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.querySelector(`.nav-item[data-section="${nombre}"]`).classList.add("active");

  document.getElementById("pageTitle").textContent = TITULOS[nombre][0];
  document.getElementById("pageSubtitle").textContent = TITULOS[nombre][1];

  document.getElementById("sidebar").classList.remove("open");

  if (nombre === "registrar") construirFormRegistrar();
  if (nombre === "actualizar") construirFormActualizar();
  if (nombre === "configuracion") construirFormConfiguracion();
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => irASeccion(btn.dataset.section));
});
document.getElementById("navToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

function requiereDatos(nombreSeccionEl) {
  if (!state.datosRegistrados) {
    nombreSeccionEl.innerHTML = `<p class="empty-note">Debe registrar los datos primero, en "Registrar consumo".</p>`;
    return false;
  }
  return true;
}

/* =========================================================
   1. REGISTRAR CONSUMO (formulario dinámico)
   ========================================================= */
function construirFormRegistrar() {
  document.getElementById("numPeriodosLabel1").textContent = state.numPeriodos;
  const form = document.getElementById("formRegistrar");
  form.innerHTML = "";

  for (let i = 0; i < state.numEquipos; i++) {
    const block = document.createElement("div");
    block.className = "equipo-block";
    block.innerHTML = `
      <div class="equipo-block-title">
        <span>${state.nombresEquipos[i]} <span class="muted mono">(ID bin: ${state.idBinario[i]})</span></span>
      </div>
      <label class="field-label">Estado</label>
      <select class="input estado-select" data-idx="${i}">
        <option value="Encendido">Encendido</option>
        <option value="Apagado">Apagado</option>
      </select>
      <div class="periodo-grid" data-idx="${i}"></div>
    `;
    form.appendChild(block);

    const grid = block.querySelector(".periodo-grid");
    for (let j = 0; j < state.numPeriodos; j++) {
      const wrap = document.createElement("div");
      wrap.innerHTML = `
        <label>${state.diasNombres[j]} (kWh)</label>
        <input type="number" class="input consumo-input" min="0" step="0.01" value="0" data-i="${i}" data-j="${j}">
      `;
      grid.appendChild(wrap);
    }

    const select = block.querySelector(".estado-select");
    select.addEventListener("change", () => {
      grid.style.display = select.value === "Apagado" ? "none" : "grid";
    });
  }
}

document.getElementById("btnRegistrarSubmit").addEventListener("click", () => {
  const estados = document.querySelectorAll(".estado-select");
  const inputs = document.querySelectorAll(".consumo-input");

  // Validación: ningún consumo puede ser negativo
  for (const inp of inputs) {
    if (Number(inp.value) < 0) {
      toast("El consumo no puede ser negativo. Revisa los campos marcados.", "error");
      inp.style.borderColor = "var(--red)";
      return;
    }
  }

  estados.forEach(sel => {
    const i = Number(sel.dataset.idx);
    state.estado[i] = sel.value;
  });

  let avisoUmbral = false;
  for (let i = 0; i < state.numEquipos; i++) {
    if (state.estado[i] === "Apagado") {
      state.consumo[i] = new Array(state.numPeriodos).fill(0);
    } else {
      for (let j = 0; j < state.numPeriodos; j++) {
        const inp = document.querySelector(`.consumo-input[data-i="${i}"][data-j="${j}"]`);
        const val = Number(inp.value) || 0;
        state.consumo[i][j] = val;
        if (val > UMBRAL_DIA) avisoUmbral = true;
      }
    }
  }

  state.datosRegistrados = true;
  actualizarEstadoSistema();
  recalcularSistema();
  toast("Registro completo. Estadísticas recalculadas.", "success");
  if (avisoUmbral) toast(`Aviso: algún periodo superó el umbral de ${UMBRAL_DIA} kWh.`, "info");
});

/* =========================================================
   2. ACTUALIZAR EQUIPO ESPECÍFICO
   ========================================================= */
function construirFormActualizar() {
  const select = document.getElementById("selectEquipoActualizar");
  select.innerHTML = state.nombresEquipos.map((n, i) => `<option value="${i}">${n}</option>`).join("");
  select.onchange = () => renderFormActualizarEquipo(Number(select.value));
  renderFormActualizarEquipo(0);
}

function renderFormActualizarEquipo(i) {
  const wrap = document.getElementById("formActualizarWrap");
  const estadoActual = state.estado[i] || "Apagado";
  let html = `
    <label class="field-label">Nuevo estado de ${state.nombresEquipos[i]}</label>
    <select class="input" id="actEstado">
      <option value="Encendido" ${estadoActual === "Encendido" ? "selected" : ""}>Encendido</option>
      <option value="Apagado" ${estadoActual === "Apagado" ? "selected" : ""}>Apagado</option>
    </select>
    <div class="periodo-grid" id="actGrid" style="${estadoActual === "Apagado" ? "display:none" : ""}">
  `;
  for (let j = 0; j < state.numPeriodos; j++) {
    const val = (state.consumo[i] && state.consumo[i][j] !== undefined) ? state.consumo[i][j] : 0;
    html += `<div><label>${state.diasNombres[j]} (kWh)</label>
      <input type="number" class="input" min="0" step="0.01" value="${val}" id="actConsumo-${j}"></div>`;
  }
  html += `</div>`;
  wrap.innerHTML = html;
  wrap.dataset.idx = i;

  document.getElementById("actEstado").addEventListener("change", (e) => {
    document.getElementById("actGrid").style.display = e.target.value === "Apagado" ? "none" : "grid";
  });
}

document.getElementById("btnActualizarSubmit").addEventListener("click", () => {
  if (!state.datosRegistrados) {
    toast("Debe registrar los datos primero (sección Registrar consumo).", "error");
    return;
  }
  const wrap = document.getElementById("formActualizarWrap");
  const i = Number(wrap.dataset.idx);
  const nuevoEstado = document.getElementById("actEstado").value;

  if (nuevoEstado === "Apagado") {
    state.consumo[i] = new Array(state.numPeriodos).fill(0);
  } else {
    for (let j = 0; j < state.numPeriodos; j++) {
      const inp = document.getElementById(`actConsumo-${j}`);
      const val = Number(inp.value);
      if (val < 0) {
        toast("El consumo no puede ser negativo.", "error");
        return;
      }
      state.consumo[i][j] = val;
    }
  }
  state.estado[i] = nuevoEstado;
  recalcularSistema();
  toast(`${state.nombresEquipos[i]} actualizado. Sistema recalculado.`, "success");
});

/* =========================================================
   3. HISTORIAL
   ========================================================= */
function renderHistorial() {
  const wrap = document.getElementById("historialWrap");
  if (!requiereDatos(wrap)) return;

  let html = "";
  for (let i = 0; i < state.numEquipos; i++) {
    html += `<div class="equipo-block">
      <div class="equipo-block-title">
        <span class="mono">ID:${state.idBinario[i]} (bin)</span>
        <span>${state.nombresEquipos[i]} — ${badge(state.estado[i] === "Encendido" ? "NORMAL" : "BAJO", state.estado[i])}</span>
      </div>
      <table><tbody>`;
    for (let j = 0; j < state.numPeriodos; j++) {
      html += `<tr><td>${state.diasNombres[j]}</td><td class="mono">${money(state.consumo[i][j])} kWh</td></tr>`;
    }
    html += `</tbody><tfoot><tr><td>Total del equipo</td><td class="mono">${money(state.totalEquipo[i])} kWh</td></tr></tfoot></table>
    </div>`;
  }
  wrap.innerHTML = html;
}

function badge(clase, textoOverride) {
  const map = { CRITICO: "badge-critico", ALTO: "badge-alto", NORMAL: "badge-normal", BAJO: "badge-bajo" };
  return `<span class="badge ${map[clase] || "badge-normal"}">${textoOverride || clase}</span>`;
}

/* =========================================================
   4. ESTADÍSTICA GENERAL
   ========================================================= */
function renderEstadistica() {
  const wrap = document.getElementById("estadisticaWrap");
  if (!requiereDatos(wrap)) return;
  wrap.innerHTML = `
    <div class="kv-row"><span>Consumo total del sistema</span><strong>${money(state.totalGeneral)} kWh</strong></div>
    <div class="kv-row"><span>Consumo promedio por equipo</span><strong>${money(state.promedioGeneral)} kWh</strong></div>
    <div class="kv-row"><span>Consumo máximo</span><strong>${state.nombresEquipos[state.posMax]} (${money(state.maxConsumo)} kWh)</strong></div>
    <div class="kv-row"><span>Consumo mínimo</span><strong>${state.nombresEquipos[state.posMin]} (${money(state.minConsumo)} kWh)</strong></div>
    <div class="kv-row"><span>Costo total estimado</span><strong>$${money(state.costoGeneral)} (tarifa $${money(state.tarifa)}/kWh)</strong></div>
  `;
}

/* =========================================================
   5. PROCEDIMIENTO MATEMÁTICO
   ========================================================= */
function renderProcedimiento() {
  const wrap = document.getElementById("procedimientoWrap");
  if (!requiereDatos(wrap)) return;

  let html = `<div class="formula-item">Promedio = ConsumoTotal / CantidadEquipos<br>
    Promedio = ${money(state.totalGeneral)} / ${state.numEquipos} = ${money(state.promedioGeneral)} kWh</div>`;

  for (let i = 0; i < state.numEquipos; i++) {
    html += `<div class="formula-item">% de ${state.nombresEquipos[i]} = (${money(state.totalEquipo[i])} / ${money(state.totalGeneral)}) * 100 = ${money(state.porcentaje[i])}%</div>`;
  }

  const valorWh = state.totalGeneral * 1000;
  const valorMWh = state.totalGeneral / 1000;
  html += `<div class="formula-item">Conversión de unidades:<br>
    ${money(state.totalGeneral)} kWh = ${money(valorWh)} Wh<br>
    ${money(state.totalGeneral)} kWh = ${money(valorMWh)} MWh</div>`;

  html += `<div class="formula-item">Fórmula de costo: Costo = ConsumoTotal(kWh) * Tarifa($/kWh)</div>`;
  for (let i = 0; i < state.numEquipos; i++) {
    html += `<div class="formula-item">Costo de ${state.nombresEquipos[i]} = ${money(state.totalEquipo[i])} * ${money(state.tarifa)} = $${money(state.costoEquipo[i])}</div>`;
  }
  html += `<div class="formula-item">Costo total = ${money(state.totalGeneral)} * ${money(state.tarifa)} = $${money(state.costoGeneral)}</div>`;

  wrap.innerHTML = html;
}

/* =========================================================
   6. CLASIFICACIÓN Y TENDENCIA
   ========================================================= */
function renderClasificacion() {
  const tbody = document.querySelector("#clasifTable tbody");
  if (!state.datosRegistrados) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-note">Debe registrar los datos primero.</td></tr>`;
    return;
  }
  let html = "";
  for (let i = 0; i < state.numEquipos; i++) {
    const tendClase = state.tendencia[i] === "AUMENTO" ? "tend-aumento" : state.tendencia[i] === "DISMINUCION" ? "tend-disminucion" : "tend-estable";
    html += `<tr><td>${state.nombresEquipos[i]}</td><td>${badge(state.clasificacion[i])}</td><td class="${tendClase}">${state.tendencia[i]}</td></tr>`;
  }
  tbody.innerHTML = html;
}

/* =========================================================
   7. RANKING (tabla + gráfico canvas)
   ========================================================= */
function renderRanking() {
  const tbody = document.querySelector("#rankingTable tbody");
  const canvas = document.getElementById("rankingCanvas");
  if (!state.datosRegistrados) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-note">Debe registrar los datos primero.</td></tr>`;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  let html = "";
  for (let pos = 0; pos < state.numEquipos; pos++) {
    const idx = state.orden[pos];
    html += `<tr><td>${pos + 1}</td><td>${state.nombresEquipos[idx]}</td><td class="mono">${money(state.totalEquipo[idx])} kWh</td><td class="mono">${money(state.porcentaje[idx])}%</td><td class="mono">$${money(state.costoEquipo[idx])}</td></tr>`;
  }
  tbody.innerHTML = html;

  dibujarBarras(canvas);
}

function dibujarBarras(canvas) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const n = state.numEquipos;
  const padding = 30;
  const chartW = w - padding * 2;
  const chartH = h - 50;
  const barGap = 14;
  const barW = (chartW - barGap * (n - 1)) / n;
  const max = state.maxConsumo || 1;

  for (let pos = 0; pos < n; pos++) {
    const idx = state.orden[pos];
    const val = state.totalEquipo[idx];
    const barH = Math.max(2, (val / max) * chartH);
    const x = padding + pos * (barW + barGap);
    const y = padding + (chartH - barH);

    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, "#2563EB");
    grad.addColorStop(1, "#22C55E");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 6);
    ctx.fill();

    ctx.fillStyle = "#0F172A";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(money(val), x + barW / 2, y - 6);

    ctx.fillStyle = "#64748B";
    ctx.font = "10px Inter, sans-serif";
    const nombreCorto = state.nombresEquipos[idx].length > 12 ? state.nombresEquipos[idx].slice(0, 11) + "…" : state.nombresEquipos[idx];
    ctx.fillText(nombreCorto, x + barW / 2, padding + chartH + 16);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* =========================================================
   8. RECOMENDACIONES
   ========================================================= */
function renderRecomendaciones() {
  const list = document.getElementById("recomendacionesList");
  if (!state.datosRegistrados) {
    list.innerHTML = `<li class="empty-note" style="background:none;border:none;">Debe registrar los datos primero.</li>`;
    return;
  }
  let html = state.recomendacion.map(r => `<li>${r}</li>`).join("");
  if (state.equiposEncendidos > 1 && state.contadorAlertas > 1) {
    html += `<li>Se recomienda redistribuir los horarios de funcionamiento, ya que existen ${state.contadorAlertas} equipos con consumo elevado encendidos simultáneamente.</li>`;
  }
  list.innerHTML = html;
}

/* =========================================================
   9. ALERTAS
   ========================================================= */
function renderAlertas() {
  const list = document.getElementById("alertasList");
  if (!state.datosRegistrados) {
    list.innerHTML = `<li class="empty-note" style="background:none;border:none;">Debe registrar los datos primero.</li>`;
    return;
  }
  const activas = [];
  for (let i = 0; i < state.numEquipos; i++) {
    if (state.alerta[i]) {
      activas.push(`<li><strong>[ALERTA]</strong> ${state.nombresEquipos[i]}: nivel ${state.clasificacion[i]} y está Encendido → se activa la alerta.</li>`);
    }
  }
  if (activas.length === 0) {
    list.innerHTML = `<li style="background:#F0FDF4;border-left-color:var(--green);">No se generaron alertas. Ningún equipo encendido supera el nivel Alto/Crítico.</li>`;
  } else {
    list.innerHTML = activas.join("");
  }
}

/* =========================================================
   10. SIMULACIÓN
   ========================================================= */
document.getElementById("btnSimular").addEventListener("click", () => {
  const resumen = [];
  for (let i = 0; i < state.numEquipos; i++) {
    const encendido = Math.random() < 0.5;
    state.estado[i] = encendido ? "Encendido" : "Apagado";
    if (!encendido) {
      state.consumo[i] = new Array(state.numPeriodos).fill(0);
    } else {
      for (let j = 0; j < state.numPeriodos; j++) {
        state.consumo[i][j] = Math.floor(Math.random() * 71); // 0-70, igual que rnd.nextInt(71)
      }
    }
    resumen.push(`<div class="kv-row"><span>${state.nombresEquipos[i]}</span><strong>${state.estado[i]}</strong></div>`);
  }
  document.getElementById("simulacionResultado").innerHTML = resumen.join("");
  state.datosRegistrados = true;
  actualizarEstadoSistema();
  recalcularSistema();
  toast("Datos simulados generados. Estadísticas recalculadas.", "success");
});

/* =========================================================
   11. COSTO ECONÓMICO
   ========================================================= */
function renderCosto() {
  const tbody = document.querySelector("#costoTable tbody");
  const tfoot = document.querySelector("#costoTable tfoot");
  if (!state.datosRegistrados) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-note">Debe registrar los datos primero.</td></tr>`;
    tfoot.innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 0; i < state.numEquipos; i++) {
    html += `<tr><td>${state.nombresEquipos[i]}</td><td class="mono">${money(state.totalEquipo[i])}</td><td class="mono">$${money(state.costoEquipo[i])}</td></tr>`;
  }
  tbody.innerHTML = html;
  tfoot.innerHTML = `<tr><td>COSTO TOTAL ESTIMADO</td><td></td><td class="mono">$${money(state.costoGeneral)}</td></tr>`;
}

/* =========================================================
   12. EXPORTAR REPORTE (TXT / CSV) — sin backend, con Blob
   ========================================================= */
document.getElementById("btnExportar").addEventListener("click", () => {
  if (!state.datosRegistrados) {
    toast("Debe registrar los datos primero.", "error");
    return;
  }
  let nombre = document.getElementById("exportNombre").value.trim();
  if (!nombre) nombre = "reporte_energetico";
  const formato = document.querySelector('input[name="formatoExport"]:checked').value;

  let contenido = "";
  if (formato === "txt") {
    contenido += "==============================================================\n";
    contenido += "   REPORTE DE MONITOREO Y CONTROL DE CONSUMO ENERGETICO\n";
    contenido += "   Universidad Tecnica de Machala - Grupo 5\n";
    contenido += "==============================================================\n\n";
    contenido += `Tarifa aplicada: $${money(state.tarifa)} /kWh\n\n`;

    for (let i = 0; i < state.numEquipos; i++) {
      contenido += `Equipo: ${state.nombresEquipos[i]} (ID bin: ${state.idBinario[i]})  Estado: ${state.estado[i]}\n`;
      for (let j = 0; j < state.numPeriodos; j++) {
        contenido += `   ${state.diasNombres[j]}: ${money(state.consumo[i][j])} kWh\n`;
      }
      contenido += `   Total: ${money(state.totalEquipo[i])} kWh | ${money(state.porcentaje[i])}% del total | Costo: $${money(state.costoEquipo[i])}\n`;
      contenido += `   Clasificacion: ${state.clasificacion[i]} | Tendencia: ${state.tendencia[i]}\n`;
      contenido += `   Recomendacion: ${state.recomendacion[i]}\n\n`;
    }

    contenido += "--------------------------------------------------------------\n";
    contenido += `Consumo total del sistema: ${money(state.totalGeneral)} kWh\n`;
    contenido += `Promedio por equipo: ${money(state.promedioGeneral)} kWh\n`;
    contenido += `Equipo de mayor consumo: ${state.nombresEquipos[state.posMax]} (${money(state.maxConsumo)} kWh)\n`;
    contenido += `Equipo de menor consumo: ${state.nombresEquipos[state.posMin]} (${money(state.minConsumo)} kWh)\n`;
    contenido += `Costo total estimado: $${money(state.costoGeneral)}\n`;
    contenido += `Alertas activas: ${state.contadorAlertas}\n`;
  } else {
    contenido += "Equipo,Estado,Total_kWh,Porcentaje,Clasificacion,Tendencia,Costo_USD,Alerta\n";
    for (let i = 0; i < state.numEquipos; i++) {
      contenido += `${state.nombresEquipos[i]},${state.estado[i]},${money(state.totalEquipo[i])},${money(state.porcentaje[i])},${state.clasificacion[i]},${state.tendencia[i]},${money(state.costoEquipo[i])},${state.alerta[i] ? "SI" : "NO"}\n`;
    }
    contenido += "\n";
    contenido += `TOTAL_GENERAL,${money(state.totalGeneral)}\n`;
    contenido += `PROMEDIO_GENERAL,${money(state.promedioGeneral)}\n`;
    contenido += `COSTO_TOTAL,${money(state.costoGeneral)}\n`;
  }

  const extension = formato === "txt" ? ".txt" : ".csv";
  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre + extension;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  toast(`Reporte exportado exitosamente: ${nombre}${extension}`, "success");
});

/* =========================================================
   13. CONFIGURACIÓN DEL SISTEMA
   ========================================================= */
function construirFormConfiguracion() {
  document.getElementById("cfgNumEquipos").value = state.numEquipos;
  document.getElementById("cfgNumPeriodos").value = state.numPeriodos;
  document.getElementById("cfgTarifa").value = state.tarifa;
  construirCamposNombresEquipos();
  construirCamposNombresPeriodos();

  document.getElementById("cfgNumEquipos").oninput = construirCamposNombresEquipos;
  document.getElementById("cfgNumPeriodos").oninput = construirCamposNombresPeriodos;
}

function construirCamposNombresEquipos() {
  const n = clamp(Number(document.getElementById("cfgNumEquipos").value) || 1, 1, MAX_EQUIPOS);
  const wrap = document.getElementById("cfgNombresEquipos");
  let html = "";
  for (let i = 0; i < n; i++) {
    const val = state.nombresEquipos[i] || `Equipo ${i + 1}`;
    html += `<label class="field-label">Nombre equipo ${i + 1}</label>
      <input type="text" class="input cfg-nombre-equipo" value="${val}">`;
  }
  wrap.innerHTML = html;
}

function construirCamposNombresPeriodos() {
  const n = clamp(Number(document.getElementById("cfgNumPeriodos").value) || 1, 1, MAX_PERIODOS);
  const wrap = document.getElementById("cfgNombresPeriodos");
  let html = "";
  for (let j = 0; j < n; j++) {
    const val = state.diasNombres[j] || `Periodo ${j + 1}`;
    html += `<label class="field-label">Etiqueta periodo ${j + 1}</label>
      <input type="text" class="input cfg-nombre-periodo" value="${val}">`;
  }
  wrap.innerHTML = html;
}

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

document.getElementById("btnGuardarConfig").addEventListener("click", () => {
  const nuevoNumEquipos = clamp(Number(document.getElementById("cfgNumEquipos").value) || 1, 1, MAX_EQUIPOS);
  const nuevoNumPeriodos = clamp(Number(document.getElementById("cfgNumPeriodos").value) || 1, 1, MAX_PERIODOS);
  const nuevaTarifa = Number(document.getElementById("cfgTarifa").value);

  if (nuevaTarifa < 0) {
    toast("La tarifa no puede ser negativa.", "error");
    return;
  }

  const nombresEquiposNuevos = Array.from(document.querySelectorAll(".cfg-nombre-equipo")).map((inp, i) =>
    inp.value.trim() === "" ? `Equipo ${i + 1}` : inp.value.trim()
  );
  const nombresPeriodosNuevos = Array.from(document.querySelectorAll(".cfg-nombre-periodo")).map((inp, j) =>
    inp.value.trim() === "" ? `Periodo ${j + 1}` : inp.value.trim()
  );

  state.numEquipos = nuevoNumEquipos;
  state.numPeriodos = nuevoNumPeriodos;
  state.tarifa = nuevaTarifa;
  state.nombresEquipos = nombresEquiposNuevos;
  state.diasNombres = nombresPeriodosNuevos;

  inicializarArrays();
  state.datosRegistrados = false;
  actualizarEstadoSistema();
  renderAll();

  document.getElementById("tarifaChip").textContent = `$${money(state.tarifa)} / kWh`;
  toast("Configuración actualizada. Debe registrar los datos nuevamente.", "success");
  irASeccion("registrar");
});

/* =========================================================
   DASHBOARD
   ========================================================= */
function renderDashboard() {
  document.getElementById("cardTotal").innerHTML = `${money(state.totalGeneral)} <span>kWh</span>`;
  document.getElementById("cardPromedio").innerHTML = `${money(state.promedioGeneral)} <span>kWh</span>`;
  document.getElementById("cardCosto").textContent = `$${money(state.costoGeneral)}`;
  document.getElementById("cardAlertas").textContent = state.contadorAlertas;

  const tbody = document.querySelector("#dashTable tbody");
  if (!state.datosRegistrados) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-note">Aún no hay datos registrados.</td></tr>`;
  } else {
    let html = "";
    for (let i = 0; i < state.numEquipos; i++) {
      html += `<tr><td>${state.nombresEquipos[i]}</td><td>${state.estado[i]}</td><td class="mono">${money(state.totalEquipo[i])}</td><td class="mono">${money(state.porcentaje[i])}%</td><td>${badge(state.clasificacion[i])}</td></tr>`;
    }
    tbody.innerHTML = html;
  }

  dibujarGauge();
}

function dibujarGauge() {
  const canvas = document.getElementById("gaugeCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h - 20, radius = 90;
  // Pista de fondo
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 0);
  ctx.stroke();

  // Capacidad estimada de referencia = umbral diario * periodos * equipos
  const capacidadEstimada = state.numEquipos * state.numPeriodos * UMBRAL_DIA;
  const fraccion = capacidadEstimada > 0 ? Math.min(state.totalGeneral / capacidadEstimada, 1) : 0;

  const grad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
  grad.addColorStop(0, "#22C55E");
  grad.addColorStop(1, fraccion > 0.75 ? "#EF4444" : "#2563EB");
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, Math.PI + Math.PI * fraccion);
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${(fraccion * 100).toFixed(0)}%`, cx, cy - 14);
  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("de capacidad estimada", cx, cy + 4);

  document.getElementById("gaugeLabel").textContent = state.datosRegistrados
    ? `${money(state.totalGeneral)} kWh de ${money(capacidadEstimada)} kWh estimados`
    : "Registra datos para ver el medidor";
}

/* =========================================================
   ESTADO DEL SISTEMA (punto de estado en la barra lateral)
   ========================================================= */
function actualizarEstadoSistema() {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  if (state.datosRegistrados) {
    dot.classList.add("ok");
    text.textContent = `${state.numEquipos} equipos · ${state.numPeriodos} periodos registrados`;
  } else {
    dot.classList.remove("ok");
    text.textContent = "Sin datos registrados";
  }
}

/* =========================================================
   RENDER GENERAL
   ========================================================= */
function renderAll() {
  renderDashboard();
  renderHistorial();
  renderEstadistica();
  renderProcedimiento();
  renderClasificacion();
  renderRanking();
  renderRecomendaciones();
  renderAlertas();
  renderCosto();
  document.getElementById("tarifaChip").textContent = `$${money(state.tarifa)} / kWh`;
}

/* ---------- Arranque ---------- */
actualizarEstadoSistema();
renderAll();
