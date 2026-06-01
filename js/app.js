/**
 * app.js
 * ================================================================
 * Punto de entrada. Une todas las piezas:
 *   inputs (UI) → simulación (Calculator) → outputs (UI + Charts)
 *
 * Si quieres entender cómo fluye todo, este archivo es el mapa.
 * Cargado como ES Module desde index.html.
 * ================================================================
 */

import * as Calculator from './calculator.js';
import * as UI from './ui.js';
import * as Charts from './charts.js';

/**
 * Recalcula todo: lee inputs, corre simulación, actualiza UI y charts.
 * Debe ser idempotente y barata — se llama en cada cambio de slider.
 */
function recalcular() {
  UI.refreshOutputs();
  const inputs = UI.readInputs();
  const result = Calculator.simulate(inputs);
  UI.updateMetrics(result);
  UI.updateGoalSeek(result, Calculator.breakevens(inputs));
  UI.updateRecommendation(result);
  Charts.updateAll(result);

  // Plan de pagos: solo re-renderiza si la sección está abierta (240 filas).
  const sched = document.getElementById('schedule-details');
  if (sched && sched.open) {
    UI.renderAmortTable(Calculator.amortizationSchedule(inputs));
  }

  UI.saveState(); // persiste la config en cada cambio
}

/** Conecta los listeners de todos los sliders */
function bindSliders() {
  const ids = Object.keys(UI.INPUT_CONFIG);
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      recalcular();
      // Quitar preset activo cuando el usuario edita manualmente
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('is-active'));
    });
  });
}

/** Conecta los botones de preset */
function bindPresets() {
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.preset;
      UI.applyPreset(name);
      recalcular();
    });
  });
}

/** Conecta los toggles (cuota inicial + impuestos + vivienda primera) */
function bindToggle() {
  ['cashtoggle', 'aplicarImpuestosToggle', 'viviendaPrimeraToggle'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', recalcular);
  });
}

/** Conecta los tabs de modo de inversión ETF */
function bindModeTabs() {
  document.querySelectorAll('[data-mode-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      UI.setMode(btn.dataset.modeTarget);
      recalcular();
    });
  });
}

/** Conecta el botón de restablecer valores */
function bindReset() {
  const btn = document.getElementById('reset-btn');
  if (btn) btn.addEventListener('click', UI.resetState);
}

/** Conecta el plan de pagos (render al abrir + exportar CSV) */
function bindSchedule() {
  const details = document.getElementById('schedule-details');
  if (details) {
    details.addEventListener('toggle', () => {
      if (details.open) UI.renderAmortTable(Calculator.amortizationSchedule(UI.readInputs()));
    });
  }
  const csvBtn = document.getElementById('schedule-csv');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      UI.exportScheduleCSV(Calculator.amortizationSchedule(UI.readInputs()));
    });
  }
}

/** Bootstrap */
function init() {
  Charts.initAll();
  bindSliders();
  bindPresets();
  bindModeTabs();
  bindToggle();
  bindSchedule();
  bindReset();
  UI.loadState(); // restaura la config guardada antes del primer cálculo
  recalcular();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
