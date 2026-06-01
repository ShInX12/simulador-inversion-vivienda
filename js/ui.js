/**
 * ui.js
 * ================================================================
 * Capa de interfaz: lee inputs, formatea números, actualiza DOM.
 *
 * No hace cálculos financieros (eso vive en calculator.js).
 * No habla con Chart.js (eso vive en charts.js).
 *
 * EXPORTS: readInputs, refreshOutputs, applyPreset, setMode,
 *          updateMetrics, updateRecommendation, fmtCOP, fmtCOPCuota,
 *          fmtPct, fmtUSD, INPUT_CONFIG
 * ================================================================
 */

import * as Calculator from './calculator.js';

// ----------------------------------------------------------------
// Formatters — siempre usar estos para mostrar números
// ----------------------------------------------------------------

/** Convierte un valor en COP a "$XYZ M" o "$X.X B" */
function fmtCOP(valor, decimales = 0) {
  const abs = Math.abs(valor);
  const signo = valor < 0 ? '−' : '';
  if (abs >= 1e9) return signo + '$' + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return signo + '$' + (abs / 1e6).toFixed(decimales) + 'M';
  if (abs >= 1e3) return signo + '$' + (abs / 1e3).toFixed(0) + 'k';
  return signo + '$' + abs.toFixed(0);
}

/** Convierte un valor en COP a "$X.XXM" siempre con 2 decimales (para cuotas) */
function fmtCOPCuota(valor) {
  return '$' + (valor / 1e6).toFixed(2) + 'M';
}

/** Porcentaje con N decimales */
function fmtPct(valor, decimales = 0) {
  return valor.toFixed(decimales) + '%';
}

/** Convierte un valor en USD a "$X" con miles separados */
function fmtUSD(valor) {
  return '$' + Math.round(valor).toLocaleString('en-US');
}

// ----------------------------------------------------------------
// Configuración de inputs — declarativa, fácil de extender
// ----------------------------------------------------------------
// Para AGREGAR un input nuevo, agrega una entrada aquí y un control
// en index.html. El binding al cálculo ocurre en readInputs().
// ----------------------------------------------------------------
const INPUT_CONFIG = {
  precio:        { unit: 'M-COP',     format: (v) => fmtCOP(v * 1e6) },
  ci:            { unit: 'pct',       format: (v) => fmtPct(v) },
  esc:           { unit: 'pct',       format: (v) => fmtPct(v, 1) },
  apr:           { unit: 'pct',       format: (v) => fmtPct(v, 1) },
  tasa:          { unit: 'pct',       format: (v) => parseFloat(v.toFixed(2)) + '%' },
  plazo:         { unit: 'anios',     format: (v) => v + ' años' },
  seguroVida:    { unit: 'pct',       format: (v) => parseFloat(v.toFixed(4)) + '%' },
  seguroIncendio:{ unit: 'pct',       format: (v) => parseFloat(v.toFixed(4)) + '%' },
  arr:           { unit: 'M-COP',     format: (v) => '$' + v.toFixed(1) + 'M' },
  ipc:           { unit: 'pct',       format: (v) => (Number.isInteger(v) ? fmtPct(v) : fmtPct(v, 1)) },
  adm:           { unit: 'k-COP',     format: (v) => '$' + Math.round(v) + 'k/mes' },
  admArr:        { unit: 'k-COP',     format: (v) => '$' + Math.round(v) + 'k/mes' },
  etf:           { unit: 'pct',       format: (v) => (Number.isInteger(v) ? fmtPct(v) : fmtPct(v, 1)) },
  fxi:           { unit: 'cop-rate',  format: (v) => '$' + v.toLocaleString('en-US') },
  dev:           { unit: 'pct',       format: (v) => fmtPct(v, 1) },
  aporte:        { unit: 'usd',       format: (v) => fmtUSD(v) },
  incr:          { unit: 'pct',       format: (v) => fmtPct(v, 1) },
  tarifaRenta:   { unit: 'pct',       format: (v) => fmtPct(v) },
  tarifaGanancia:{ unit: 'pct',       format: (v) => fmtPct(v) },
  costoVenta:    { unit: 'pct',       format: (v) => fmtPct(v, 1) },
  aporteAfc:     { unit: 'k-COP',     format: (v) => '$' + Math.round(v) + 'k' },
  salario:       { unit: 'M-COP',     format: (v) => '$' + v.toFixed(2) + 'M' },
  crecSal:       { unit: 'pct',       format: (v) => fmtPct(v, 1) }
};

/**
 * Lee todos los inputs del DOM y devuelve un objeto normalizado
 * para pasar a Calculator.simulate().
 *
 * Si agregas un input nuevo en INPUT_CONFIG, también agrégalo aquí
 * con la conversión de unidades correcta.
 */
function readInputs() {
  const get = (id) => +document.getElementById(id).value;
  const opt = (id, fallback) => {
    const el = document.getElementById(id);
    return el ? +el.value : fallback;
  };
  const checked = (id, fallback) => {
    const el = document.getElementById(id);
    return el ? el.checked : fallback;
  };
  const modeTabs = document.querySelector('.mode-tabs');

  return {
    precio:                    get('precio') * 1e6,           // M COP → COP
    cuotaInicialPct:           get('ci'),                     // %
    escrituracionPct:          get('esc'),                    // %
    apreciacionPct:            get('apr'),                    // %
    tasaEA:                    get('tasa'),                   // %
    plazoAnios:                get('plazo'),                  // años
    arriendoInicial:           get('arr') * 1e6,              // M COP → COP
    ipcPct:                    get('ipc'),                    // %
    adminInicial:              get('adm') * 1000,             // k COP → COP (comprador)
    adminArriendoInicial:      opt('admArr', 190) * 1000,     // k COP → COP (arrendatario)
    seguroVidaPct:             opt('seguroVida', 0.05),       // % mensual del saldo (decrece)
    seguroIncendioPct:         opt('seguroIncendio', 0.045),  // % mensual del valor inicial (fijo)
    retornoEtfUsdPct:          get('etf'),                    // % (en USD)
    tasaCopUsdInicial:         get('fxi'),                    // COP/USD
    devaluacionAnualPct:       get('dev'),                    // %
    modo:                      modeTabs ? modeTabs.dataset.mode : 'aporte-fijo',
    aporteMensualUsd:          get('aporte'),                 // USD directo (sin escalar)
    aporteIncrementoPct:       get('incr'),                   // %
    invertirCashInicial:       checked('cashtoggle', true),
    // Tax & exit-cost model — defensivo, con fallback a defaults si DOM aún no tiene los inputs
    aplicarImpuestos:          checked('aplicarImpuestosToggle', true),
    tarifaRentaMarginal:       opt('tarifaRenta', 33),        // %
    tarifaGananciaViviendaPct: opt('tarifaGanancia', 10),     // %
    costoVentaViviendaPct:     opt('costoVenta', 5),          // %
    viviendaPrimera:           checked('viviendaPrimeraToggle', true),
    aporteAfcMensual:          opt('aporteAfc', 0) * 1000,    // k COP → COP
    // Carga financiera (solo visualización)
    salarioMensual:            opt('salario', 5) * 1e6,       // M COP → COP
    crecimientoSalarialPct:    opt('crecSal', 5)              // %
  };
}

/**
 * Sincroniza los outputs de los sliders con sus valores actuales.
 * Llamar cada vez que cambia un slider o se aplica un preset.
 */
function refreshOutputs() {
  Object.keys(INPUT_CONFIG).forEach((id) => {
    const el = document.getElementById(id);
    const out = document.getElementById(id + '-out');
    if (!el || !out) return;
    const cfg = INPUT_CONFIG[id];
    out.textContent = cfg.format(+el.value);
  });

  // Para inputs que son % del precio, mostrar además el equivalente en COP.
  // Un decimal solo si el monto en millones tiene parte decimal.
  const precioEl = document.getElementById('precio');
  const montoMStr = (monto) => {
    const m = monto / 1e6;
    if (monto === 0) return '$0';
    return Number.isInteger(m) ? '$' + m + 'M' : '$' + m.toFixed(1) + 'M';
  };
  const appendMonto = (id, decimalesPct) => {
    const el = document.getElementById(id);
    const out = document.getElementById(id + '-out');
    if (!el || !out || !precioEl) return;
    const monto = (+precioEl.value * 1e6) * (+el.value) / 100;
    out.textContent = fmtPct(+el.value, decimalesPct) + ' · ' + montoMStr(monto);
  };

  appendMonto('ci', 0);   // Cuota inicial
  appendMonto('esc', 1);  // Costos de escrituración

  // Seguro de vida: % del saldo (monto financiado). Muestra tasa + monto inicial.
  const vidaEl = document.getElementById('seguroVida');
  const vidaOut = document.getElementById('seguroVida-out');
  const ciEl = document.getElementById('ci');
  if (vidaEl && vidaOut && precioEl && ciEl) {
    const montoFin = (+precioEl.value * 1e6) * (1 - (+ciEl.value) / 100);
    const seguroVida = Math.round(montoFin * (+vidaEl.value) / 100);
    vidaOut.textContent = parseFloat((+vidaEl.value).toFixed(4)) + '% · $' + seguroVida.toLocaleString('en-US') + '/mes';
  }

  // Seguro de incendio: % del valor de la vivienda (fijo). Muestra tasa + monto exacto.
  const incEl = document.getElementById('seguroIncendio');
  const incOut = document.getElementById('seguroIncendio-out');
  if (incEl && incOut && precioEl) {
    const seguroInc = Math.round((+precioEl.value * 1e6) * (+incEl.value) / 100);
    incOut.textContent = parseFloat((+incEl.value).toFixed(4)) + '% · $' + seguroInc.toLocaleString('en-US') + '/mes';
  }
}

/**
 * Aplica un preset por nombre. Los presets viven en Calculator.PRESETS.
 */
function applyPreset(name) {
  const preset = Calculator.PRESETS[name];
  if (!preset) return;

  // Modo (tab) si el preset lo define
  if (preset.modo) setMode(preset.modo);

  // Setea cualquier slider declarado en el preset
  if (preset.sliders) {
    Object.entries(preset.sliders).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
  }

  document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('is-active'));
  const activeBtn = document.querySelector(`.preset-btn[data-preset="${name}"]`);
  if (activeBtn) activeBtn.classList.add('is-active');

  refreshOutputs();
}

/**
 * Activa un modo de inversión ETF y sincroniza el estado del DOM.
 * El recálculo lo dispara el caller — esta función no calcula nada.
 */
function setMode(name) {
  const tabs = document.querySelector('.mode-tabs');
  const panel = document.querySelector('.panel--controls');
  if (tabs)  tabs.dataset.mode = name;
  if (panel) panel.dataset.mode = name;
  document.querySelectorAll('.mode-tab').forEach((btn) => {
    const active = btn.dataset.modeTarget === name;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

/** Helper: setea textContent si el elemento existe */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/** Helper: formatea un año de cruce o "Nunca" */
function fmtCruce(anio) {
  return anio ? 'Año ' + anio : 'Nunca';
}

/**
 * Actualiza el scorecard comparativo + la tira de detalles con un resultado.
 */
function updateMetrics(result) {
  const dif = result.diferencia;
  const ganaCompra = dif >= 0;
  const postTax = result.input.aplicarImpuestos !== false;

  // --- Veredicto objetivo: comparación dual (sin connotación bueno/malo) ---
  const pc = result.patrimonioCompraFinal;
  const pa = result.patrimonioArriendoFinal;
  setText('v-compra', fmtCOP(pc));
  setText('v-arr', fmtCOP(pa));

  const total = pc + pa;
  const pctCompra = total > 0 ? (pc / total) * 100 : 50;
  const barCompra = document.getElementById('v-bar-compra');
  const barArr = document.getElementById('v-bar-arr');
  if (barCompra) barCompra.style.width = pctCompra + '%';
  if (barArr) barArr.style.width = (100 - pctCompra) + '%';

  setText('v-result',
    `Gana ${ganaCompra ? 'comprar' : 'arrendar'} por ${fmtCOP(Math.abs(dif))}` +
    (postTax ? ' (post-tax)' : ' (bruto)'));

  // --- Scorecard: Comprar ---
  setText('sc-compra-patrimonio', fmtCOP(result.patrimonioCompraFinal));
  setText('sc-compra-perdida',    fmtCOP(result.final.gastoCompraSunkAcum));
  setText('sc-compra-entrada',    fmtCOP(result.cashInicial));
  setText('sc-compra-mensual',    fmtCOPCuota(result.cuota));

  // --- Scorecard: Arrendar + ETF ---
  setText('sc-arr-patrimonio', fmtCOP(result.patrimonioArriendoFinal));
  setText('sc-arr-perdida',    fmtCOP(result.final.gastoArriendoAcum));
  setText('sc-arr-entrada',    '$0');
  setText('sc-arr-mensual',    fmtCOPCuota(result.input.arriendoInicial));

  // --- Tira de detalles ---
  setText('d-int',         fmtCOP(result.totalIntereses));
  setText('d-etf-usd',     fmtUSD(result.etfFinalUsd || 0));
  setText('d-cruce',       fmtCruce(result.crossover));
  setText('d-cruce-pat',   fmtCruce(result.crossoverPatrimonio));
  setText('d-cruce-gasto', fmtCruce(result.spendingCrossoverYear));
}

// Metadatos de presentación de las palancas de goal-seek (label + formato + rango).
const GOALSEEK_META = {
  retornoEtfUsdPct: { label: 'Retorno ETF',          fmt: (v) => fmtPct(v, 1), min: 0,     max: 18 },
  apreciacionPct:   { label: 'Apreciación vivienda', fmt: (v) => fmtPct(v, 1), min: 0,     max: 10 },
  tasaEA:           { label: 'Tasa hipoteca',        fmt: (v) => fmtPct(v, 1), min: 4,     max: 18 },
  arriendoInicial:  { label: 'Arriendo',             fmt: (v) => fmtCOP(v),    min: 0.5e6, max: 6e6 }
};

/**
 * Actualiza la sección de goal-seek: qué tendría que pasar para invertir el veredicto.
 * @param {Object} result      Resultado de simulate() (para saber quién gana hoy)
 * @param {Array}  breakevens  Array de { key, umbral, actual } de Calculator.breakevens()
 */
function updateGoalSeek(result, breakevens) {
  const header = document.getElementById('gs-header');
  const list = document.getElementById('gs-list');
  if (!header || !list) return;

  const ganaCompra = result.diferencia >= 0;
  const elQueGana = ganaCompra ? 'comprar' : 'arrendar';
  const elOtro = ganaCompra ? 'arrendar' : 'comprar';
  header.textContent =
    `Hoy gana ${elQueGana} por ${fmtCOP(Math.abs(result.diferencia))}. Para que gane ${elOtro}, necesitarías:`;

  list.innerHTML = '';
  breakevens.forEach(({ key, umbral, actual }) => {
    const meta = GOALSEEK_META[key];
    if (!meta) return;
    const li = document.createElement('li');
    if (umbral === null) {
      li.textContent = `${meta.label}: ni en el rango (${meta.fmt(meta.min)}–${meta.fmt(meta.max)}) cambia el resultado`;
      li.classList.add('goalseek__item--flat');
    } else {
      const dir = umbral > actual ? '≥' : '≤';
      li.innerHTML = `${meta.label} <strong>${dir} ${meta.fmt(umbral)}</strong> <span class="goalseek__now">(hoy ${meta.fmt(actual)})</span>`;
    }
    list.appendChild(li);
  });
}

/** COP entero con separador de miles, para la tabla de pagos */
function fmtCOPInt(v) {
  return '$' + Math.round(v).toLocaleString('en-US');
}

/**
 * Renderiza la tabla del plan de pagos en #schedule-body.
 * Llamar solo cuando la sección está abierta (240 filas).
 */
function renderAmortTable(schedule) {
  const body = document.getElementById('schedule-body');
  if (!body) return;
  const frag = document.createDocumentFragment();
  schedule.forEach((r) => {
    const tr = document.createElement('tr');
    const cells = [
      r.mes,
      fmtCOPInt(r.interes),
      fmtCOPInt(r.capital),
      fmtCOPInt(r.cuota),
      fmtCOPInt(r.seguroVida),
      fmtCOPInt(r.seguroIncendio),
      fmtCOPInt(r.cuotaTotal),
      fmtCOPInt(r.saldo)
    ];
    cells.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  });
  body.replaceChildren(frag);

  // Fila de totales en el <tfoot>
  const foot = document.getElementById('schedule-foot');
  if (foot) {
    const t = Calculator.scheduleTotals(schedule);
    const totals = [
      'Total',
      fmtCOPInt(t.interes),
      fmtCOPInt(t.capital),
      fmtCOPInt(t.cuota),
      fmtCOPInt(t.seguroVida),
      fmtCOPInt(t.seguroIncendio),
      fmtCOPInt(t.cuotaTotal),
      '—'
    ];
    const tr = document.createElement('tr');
    totals.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });
    foot.replaceChildren(tr);
  }
}

/**
 * Exporta el plan de pagos a CSV y dispara la descarga.
 */
function exportScheduleCSV(schedule) {
  const headers = ['Mes', 'Interes', 'Capital', 'Cuota', 'SeguroVida', 'SeguroIncendio', 'CuotaConSeguros', 'Saldo'];
  const lines = [headers.join(',')];
  schedule.forEach((r) => {
    lines.push([
      r.mes,
      Math.round(r.interes),
      Math.round(r.capital),
      Math.round(r.cuota),
      Math.round(r.seguroVida),
      Math.round(r.seguroIncendio),
      Math.round(r.cuotaTotal),
      Math.round(r.saldo)
    ].join(','));
  });
  const t = Calculator.scheduleTotals(schedule);
  lines.push(['Total', Math.round(t.interes), Math.round(t.capital), Math.round(t.cuota),
    Math.round(t.seguroVida), Math.round(t.seguroIncendio), Math.round(t.cuotaTotal), ''].join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plan-de-pagos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Actualiza el bloque de recomendación con texto generado.
 */
function updateRecommendation(result) {
  const text = Calculator.generarRecomendacion(result);
  document.getElementById('recomendacion-texto').textContent = text;
}

// ----------------------------------------------------------------
// Persistencia en localStorage — guarda/restaura la config del usuario
// ----------------------------------------------------------------
const STORAGE_KEY = 'calc-state-v1';
const TOGGLE_IDS = ['cashtoggle', 'aplicarImpuestosToggle', 'viviendaPrimeraToggle'];

/** Guarda el estado de todos los controles en localStorage (silencioso). */
function saveState() {
  try {
    const sliders = {};
    Object.keys(INPUT_CONFIG).forEach((id) => {
      const el = document.getElementById(id);
      if (el) sliders[id] = el.value;
    });
    const toggles = {};
    TOGGLE_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) toggles[id] = el.checked;
    });
    const modeTabs = document.querySelector('.mode-tabs');
    const state = { v: 1, sliders, toggles, modo: modeTabs ? modeTabs.dataset.mode : undefined };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* localStorage no disponible (modo incógnito) — seguimos sin persistir */
  }
}

/** Restaura el estado guardado a los controles del DOM. Defensivo. */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.sliders) {
      Object.entries(state.sliders).forEach(([id, v]) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
      });
    }
    if (state.toggles) {
      Object.entries(state.toggles).forEach(([id, checked]) => {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
      });
    }
    if (state.modo) setMode(state.modo);
  } catch (e) {
    /* config corrupta — ignorar, la app usa los defaults del HTML */
  }
}

/** Limpia el estado guardado y recarga (vuelve a los defaults de fábrica). */
function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* noop */
  }
  window.location.reload();
}

export {
  readInputs,
  refreshOutputs,
  applyPreset,
  setMode,
  updateMetrics,
  updateGoalSeek,
  renderAmortTable,
  exportScheduleCSV,
  updateRecommendation,
  saveState,
  loadState,
  resetState,
  fmtCOP,
  fmtCOPCuota,
  fmtPct,
  fmtUSD,
  INPUT_CONFIG
};
