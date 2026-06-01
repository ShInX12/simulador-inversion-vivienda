/**
 * charts.js
 * ================================================================
 * Configuración y actualización de los 3 gráficos con Chart.js.
 *
 * Lee colores de las CSS variables vía getComputedStyle para que
 * los charts se adapten automáticamente al modo claro/oscuro.
 *
 * Chart.js se carga vía CDN en index.html (global `Chart`), por eso
 * este módulo no lo importa explícitamente.
 *
 * EXPORTS: initAll, updateAll
 * ================================================================
 */

let mainChart = null;
let amortChart = null;
let rentChart = null;
let gastoChart = null;
let aporteChart = null;
let compoundChart = null;
let cargaChart = null;

/**
 * Plugin custom para dibujar una línea vertical punteada en un año específico.
 * Se usa en gastoChart para marcar el spending crossover.
 * Se controla vía options.plugins.verticalLine.crossoverYear (year a marcar) y
 * options.plugins.verticalLine.{color,label}.
 */
const verticalLinePlugin = {
  id: 'verticalLine',
  afterDraw(chart, args, options) {
    const year = options.crossoverYear;
    if (year === null || year === undefined) return;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    if (!xScale || !yScale) return;
    const xPx = xScale.getPixelForValue(year);
    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPx, yScale.top);
    ctx.lineTo(xPx, yScale.bottom);
    ctx.strokeStyle = options.color || '#888';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    if (options.label) {
      ctx.fillStyle = options.color || '#888';
      ctx.font = "11px 'Manrope', system-ui, sans-serif";
      ctx.fillText(options.label, xPx + 4, yScale.top + 12);
    }
    ctx.restore();
  }
};
Chart.register(verticalLinePlugin);

/** Lee una variable CSS desde :root */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Genera el set de colores para los charts a partir de las variables CSS */
function palette() {
  return {
    green:    cssVar('--accent-green')   || '#2d5a3f',
    coral:    cssVar('--accent-coral')   || '#b54a2a',
    navy:     cssVar('--accent-navy')    || '#1f3a5f',
    amber:    cssVar('--accent-amber')   || '#a8731e',
    ink:      cssVar('--ink-primary')    || '#1a1f17',
    muted:    cssVar('--ink-secondary')  || '#5a5e52',
    tertiary: cssVar('--ink-tertiary')   || '#8a8d80',
    rule:     cssVar('--ink-rule')       || '#d6cfba',
    bg:       cssVar('--bg-card')        || '#ffffff'
  };
}

/** Convierte un hex a rgba con alpha dado (para fills semi-transparentes) */
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Defaults compartidos entre los 3 charts (tipografía, ejes) */
function commonOptions() {
  const c = palette();
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    // El tooltip aparece con solo estar en esa posición X (sin tocar la línea exacta)
    // y muestra todos los datasets de ese año a la vez. Mucho más fácil de leer.
    interaction: { mode: 'index', intersect: false },
    font: {
      family: "'Manrope', system-ui, sans-serif",
      size: 11
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.ink,
        titleColor: c.bg,
        bodyColor: c.bg,
        borderColor: c.rule,
        borderWidth: 0.5,
        padding: 10,
        titleFont: { size: 12, weight: '500' },
        bodyFont: { size: 12, family: "'JetBrains Mono', monospace" },
        cornerRadius: 4
      }
    }
  };
}

/** Inicializa los 3 gráficos con datasets vacíos. Llamar UNA vez al inicio. */
function initAll() {
  const c = palette();
  const common = commonOptions();

  mainChart = new Chart(document.getElementById('cMain'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Compra',
          data: [],
          borderColor: c.green,
          backgroundColor: hexToRgba(c.green, 0.10),
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5
        },
        {
          label: 'Arriendo + ETF',
          data: [],
          borderColor: c.navy,
          backgroundColor: hexToRgba(c.navy, 0.08),
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.3,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      ...common,
      plugins: {
        ...common.plugins,
        tooltip: {
          ...common.plugins.tooltip,
          callbacks: { label: (ctx) => ctx.dataset.label + ': $' + ctx.parsed.y + 'M' }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Año', color: c.muted },
          grid: { display: false },
          ticks: { color: c.muted }
        },
        y: {
          grid: { color: c.rule },
          ticks: { color: c.muted, callback: (v) => '$' + v + 'M' }
        }
      }
    }
  });

  amortChart = new Chart(document.getElementById('cAmort'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        { label: 'Intereses', data: [], backgroundColor: c.coral, borderWidth: 0 },
        { label: 'Capital',   data: [], backgroundColor: c.green, borderWidth: 0 }
      ]
    },
    options: {
      ...common,
      plugins: {
        ...common.plugins,
        tooltip: {
          ...common.plugins.tooltip,
          callbacks: {
            label: (ctx) => {
              const anualM = ctx.parsed.y;
              const mensualM = (anualM / 12).toFixed(2);
              return ctx.dataset.label + ': $' + anualM + 'M/año ($' + mensualM + 'M/mes)';
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: 'Año', color: c.muted },
          grid: { display: false },
          ticks: { color: c.muted }
        },
        y: {
          stacked: true,
          grid: { color: c.rule },
          ticks: { color: c.muted, callback: (v) => '$' + v + 'M' }
        }
      }
    }
  });

  gastoChart = new Chart(document.getElementById('cGasto'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Comprar (intereses + admin + escrituración)',
          data: [],
          borderColor: c.green,
          backgroundColor: hexToRgba(c.green, 0.08),
          borderWidth: 2,
          tension: 0.2,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5
        },
        {
          label: 'Arrendar (arriendo + admin parcial)',
          data: [],
          borderColor: c.navy,
          backgroundColor: hexToRgba(c.navy, 0.08),
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.2,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      ...common,
      plugins: {
        ...common.plugins,
        tooltip: {
          ...common.plugins.tooltip,
          callbacks: { label: (ctx) => ctx.dataset.label + ': $' + ctx.parsed.y + 'M' }
        },
        verticalLine: { crossoverYear: null, color: c.coral, label: 'Cruce' }
      },
      scales: {
        x: {
          title: { display: true, text: 'Año', color: c.muted },
          grid: { display: false },
          ticks: { color: c.muted }
        },
        y: {
          grid: { color: c.rule },
          ticks: { color: c.muted, callback: (v) => '$' + v + 'M' }
        }
      }
    }
  });

  rentChart = new Chart(document.getElementById('cRent'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Comprar (cuota + admin)',
          data: [],
          borderColor: c.green,
          borderWidth: 2,
          tension: 0.2,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Arrendar (arriendo + admin)',
          data: [],
          borderColor: c.navy,
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.2,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      ...common,
      plugins: {
        ...common.plugins,
        tooltip: {
          ...common.plugins.tooltip,
          callbacks: { label: (ctx) => ctx.dataset.label + ': $' + ctx.parsed.y + 'M/mes' }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Año', color: c.muted },
          grid: { display: false },
          ticks: { color: c.muted }
        },
        y: {
          grid: { color: c.rule },
          ticks: { color: c.muted, callback: (v) => '$' + v + 'M' }
        }
      }
    }
  });

  aporteChart = new Chart(document.getElementById('cAporte'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        { label: 'Aporte anual (USD)', data: [], backgroundColor: c.navy, borderWidth: 0 }
      ]
    },
    options: {
      ...common,
      plugins: {
        ...common.plugins,
        tooltip: {
          ...common.plugins.tooltip,
          callbacks: {
            label: (ctx) => {
              const anual = ctx.parsed.y;
              const mensual = Math.round(anual / 12);
              return [
                'Anual: $' + anual.toLocaleString('en-US') + ' USD',
                'Mensual: $' + mensual.toLocaleString('en-US') + ' USD'
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Año', color: c.muted },
          grid: { display: false },
          ticks: { color: c.muted }
        },
        y: {
          grid: { color: c.rule },
          ticks: { color: c.muted, callback: (v) => '$' + v.toLocaleString('en-US') }
        }
      }
    }
  });

  compoundChart = new Chart(document.getElementById('cCompound'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Aportes acumulados (sin interés)',
          data: [],
          borderColor: c.amber,
          borderWidth: 2,
          tension: 0.2,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Valor con interés compuesto',
          data: [],
          borderColor: c.navy,
          backgroundColor: hexToRgba(c.navy, 0.12),
          borderWidth: 2,
          tension: 0.2,
          fill: '-1', // sombrea la brecha hacia los aportes = interés compuesto generado
          pointRadius: 0
        }
      ]
    },
    options: {
      ...common,
      plugins: {
        ...common.plugins,
        tooltip: {
          ...common.plugins.tooltip,
          callbacks: {
            label: (ctx) => ctx.dataset.label + ': $' + Math.round(ctx.parsed.y).toLocaleString('en-US') + ' USD'
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Año', color: c.muted },
          grid: { display: false },
          ticks: { color: c.muted }
        },
        y: {
          grid: { color: c.rule },
          ticks: { color: c.muted, callback: (v) => '$' + v.toLocaleString('en-US') }
        }
      }
    }
  });

  cargaChart = new Chart(document.getElementById('cCarga'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Comprar (% del salario)',
          data: [],
          borderColor: c.green,
          borderWidth: 2,
          tension: 0.2,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Arrendar (% del salario)',
          data: [],
          borderColor: c.navy,
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.2,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      ...common,
      plugins: {
        ...common.plugins,
        tooltip: {
          ...common.plugins.tooltip,
          callbacks: { label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.y + '%' }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Año', color: c.muted },
          grid: { display: false },
          ticks: { color: c.muted }
        },
        y: {
          grid: { color: c.rule },
          ticks: { color: c.muted, callback: (v) => v + '%' }
        }
      }
    }
  });
}

/**
 * Refresca todos los gráficos a partir de un resultado de simulación.
 * Usa update('none') para evitar animaciones costosas en cada slide.
 */
function updateAll(result) {
  const labels = result.yearly.map((y) => y.anio);

  const equity = result.yearly.map((y) => +(y.equity / 1e6).toFixed(0));
  const etf    = result.yearly.map((y) => +(y.etf / 1e6).toFixed(0));

  mainChart.data.labels = labels;
  mainChart.data.datasets[0].data = equity;
  mainChart.data.datasets[1].data = etf;
  mainChart.update('none');

  // Amortización: solo años con datos (sin el 0)
  const amortYears = result.yearly.filter((y) => y.anio > 0);
  amortChart.data.labels = amortYears.map((y) => y.anio);
  amortChart.data.datasets[0].data = amortYears.map((y) => +(y.intAnio / 1e6).toFixed(1));
  amortChart.data.datasets[1].data = amortYears.map((y) => +(y.capAnio / 1e6).toFixed(1));
  amortChart.update('none');

  rentChart.data.labels = labels;
  rentChart.data.datasets[0].data = result.yearly.map((y) => +((y.costoCompraMes || result.cuota) / 1e6).toFixed(2));
  rentChart.data.datasets[1].data = result.yearly.map((y) => +((y.costoArriendoMes || y.arriendoEq) / 1e6).toFixed(2));
  rentChart.update('none');

  gastoChart.data.labels = labels;
  gastoChart.data.datasets[0].data = result.yearly.map((y) => +((y.gastoCompraSunkAcum || 0) / 1e6).toFixed(0));
  gastoChart.data.datasets[1].data = result.yearly.map((y) => +((y.gastoArriendoAcum || 0) / 1e6).toFixed(0));
  gastoChart.options.plugins.verticalLine.crossoverYear = result.spendingCrossoverYear;
  gastoChart.update('none');

  // Aporte anual al ETF: solo años con datos (sin el 0)
  const aporteYears = result.yearly.filter((y) => y.anio > 0);
  aporteChart.data.labels = aporteYears.map((y) => y.anio);
  aporteChart.data.datasets[0].data = aporteYears.map((y) => Math.round(y.aporteAnualUsd || 0));
  aporteChart.update('none');

  // Interés compuesto del ETF (USD): valor con crecimiento vs aportes sin crecimiento
  compoundChart.data.labels = labels;
  compoundChart.data.datasets[0].data = result.yearly.map((y) => Math.round(y.aportadoAcumUsd || 0));
  compoundChart.data.datasets[1].data = result.yearly.map((y) => Math.round(y.etfValorUsd || 0));
  compoundChart.update('none');

  // Carga financiera: costo total mensual como % del salario
  cargaChart.data.labels = labels;
  cargaChart.data.datasets[0].data = result.yearly.map((y) => +(y.cargaCompraPct || 0).toFixed(1));
  cargaChart.data.datasets[1].data = result.yearly.map((y) => +(y.cargaArriendoPct || 0).toFixed(1));
  cargaChart.update('none');
}

export { initAll, updateAll };
