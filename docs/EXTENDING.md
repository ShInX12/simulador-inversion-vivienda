# Cómo extender la calculadora

Recetas concretas para tareas comunes. Cada una se puede pegar en una conversación con Claude para pedir el cambio.

---

## Tabla de contenidos

1. [Agregar una nueva variable de entrada](#1-agregar-una-nueva-variable-de-entrada)
2. [Agregar un nuevo preset](#2-agregar-un-nuevo-preset)
3. [Agregar un nuevo gráfico](#3-agregar-un-nuevo-gráfico)
4. [Cambiar el texto de recomendación](#4-cambiar-el-texto-de-recomendación)
5. [Agregar impuestos al modelo](#5-agregar-impuestos-al-modelo)
6. [Soportar tasas en UVR](#6-soportar-tasas-en-uvr)
7. [Persistir la configuración del usuario](#7-persistir-la-configuración-del-usuario)
8. [Exportar el resultado a PDF o Excel](#8-exportar-el-resultado-a-pdf-o-excel)
9. [Trabajar con el plan de pagos (amortización)](#9-trabajar-con-el-plan-de-pagos-amortización)
10. [Análisis de sensibilidad (goal seek y breakevens)](#10-análisis-de-sensibilidad-goal-seek-y-breakevens)
11. [Cómo trabajar con Claude para extender](#11-cómo-trabajar-con-claude-para-extender)

---

## 1. Agregar una nueva variable de entrada

**Ejemplo:** quiero modelar los costos de mantenimiento mensuales del propietario (reparaciones, mejoras), separados del admin/predial.

**Cuatro pasos:**

### a) En `index.html`, agregar el control

Dentro del bloque `control-group` que corresponda (ej. "Vivienda"):

```html
<div class="control" data-control="mant">
  <div class="control__head">
    <label for="mant">Mantenimiento mensual</label>
    <output for="mant" id="mant-out">$200k</output>
  </div>
  <input type="range" id="mant" min="0" max="1000" step="20" value="200" />
  <p class="control__hint">Reparaciones promedio mensuales del propietario.</p>
</div>
```

### b) En `js/ui.js`, declarar el formato y la lectura

```javascript
const INPUT_CONFIG = {
  // ... otros
  mant: { unit: 'k-COP', format: (v) => '$' + Math.round(v) + 'k' }
};

function readInputs() {
  return {
    // ... otros
    mantenimientoInicial: get('mant') * 1000  // k → COP
  };
}
```

### c) En `js/calculator.js`, usarlo dentro de `simulate()`

```javascript
function simulate(input) {
  const { ..., mantenimientoInicial } = input;
  let mantenimiento = mantenimientoInicial;

  for (let m = 1; m <= meses; m++) {
    const costoCompra = cuota + admin + mantenimiento;  // ← incluir aquí
    // ...
    mantenimiento *= 1 + ipcMensual;  // crece con inflación
  }
}
```

> **Nota sobre el admin (ya está dividido):** el modelo NO usa un solo admin. Maneja **dos variables independientes** — `adminInicial` (admin + predial del COMPRADOR) y `adminArriendoInicial` (admin que paga el ARRENDATARIO, default $190k, sin predial ni seguro estructural). En el loop, `admin` alimenta el costo de comprar y `adminArriendo` el de arrendar; cada una crece con el IPC por su lado. Si agregás una variable que afecte solo a uno de los dos escenarios, seguí ese mismo patrón de pares separados en vez de reusar una sola.

### d) Listo

`app.js` no necesita cambios. La función `recalcular()` re-lee todos los inputs en cada cambio.

---

## 2. Agregar un nuevo preset

**Ejemplo:** un preset "Banco Caja Social" con tasa 11.8%.

### a) En `js/calculator.js`, dentro de `PRESETS`:

```javascript
const PRESETS = {
  // ... otros
  'caja-social': { tasa: 11.8, ci: 25, label: 'Banco Caja Social' }
};
```

### b) En `index.html`, dentro de `.presets__grid`:

```html
<button type="button" data-preset="caja-social" class="preset-btn">
  <span class="preset-btn__name">Caja Social</span>
  <span class="preset-btn__rate">11.8%</span>
</button>
```

Eso es todo. El handler en `app.js` ya escucha `[data-preset]`.

---

## 3. Agregar un nuevo gráfico

**Ejemplo:** un gráfico de pie que muestra la composición del costo total (intereses, capital, escrituración, admin acumulado).

### a) En `index.html`, agregar el `<canvas>` y su wrapper

```html
<figure class="chart-figure">
  <figcaption>
    <p class="chart__eyebrow">Costos totales</p>
    <h3 class="chart__title">A dónde va tu plata en 20 años</h3>
  </figcaption>
  <div class="chart-wrap">
    <canvas id="cCosts" role="img" aria-label="Distribución de costos totales"></canvas>
  </div>
</figure>
```

### b) En `js/charts.js`, declarar la instancia y su update

```javascript
let costsChart = null;

function initAll() {
  // ... otros
  costsChart = new Chart(document.getElementById('cCosts'), {
    type: 'doughnut',
    data: { labels: ['Capital', 'Intereses', 'Escrituración', 'Admin acumulado'],
            datasets: [{ data: [], backgroundColor: [c.green, c.coral, c.amber, c.muted] }] },
    options: { responsive: true, maintainAspectRatio: false,
               plugins: { legend: { display: true, position: 'bottom' } } }
  });
}

function updateAll(result) {
  // ... otros
  const adminTotal = result.yearly.reduce((sum, y) => sum + (y.admin || 0), 0);
  costsChart.data.datasets[0].data = [
    result.monto / 1e6,
    result.totalIntereses / 1e6,
    (result.input.precio * result.input.escrituracionPct / 100) / 1e6,
    adminTotal / 1e6
  ];
  costsChart.update('none');
}
```

### c) Si necesitas un dato nuevo del simulator

Por ejemplo, si quieres `adminTotal` directamente del result, agrégalo en `simulate()`:

```javascript
let admTotal = 0;
for (let m = 1; m <= meses; m++) {
  admTotal += admin;
  // ...
}
return { ..., adminTotal: admTotal };
```

---

## 4. Cambiar el texto de recomendación

Toda la lógica de "qué dice según el resultado" vive en `Calculator.generarRecomendacion()`. Edita esa función para cambiar tono, agregar caveats, mostrar advertencias específicas, etc.

```javascript
function generarRecomendacion(result) {
  const dif = result.diferencia / 1e6;
  const tasa = result.input.tasaEA;
  
  // Ejemplo: warning específico si tasa es muy alta
  if (tasa > 13) {
    return `⚠️ Con tasa de ${tasa}% EA, el costo del crédito es muy alto. Antes de decidir, intenta calificar al FNA o buscar otro banco.`;
  }
  
  // ... resto de la lógica
}
```

---

## 5. Agregar impuestos al modelo

Los impuestos cambian el resultado significativamente. Tres tipos importantes en Colombia:

### a) Beneficio tributario AFC al alquilar

Si el usuario aporta a una cuenta AFC mientras arrienda, deduce hasta el 30% del ingreso laboral, hasta un tope. Esto baja su renta gravable y le devuelve plata.

```javascript
function simulate(input) {
  // ... 
  const ahorroAFCAnual = ...; // calcular según ingreso del usuario
  if (modoArriendo) etf += ahorroAFCAnual / 12; // mensual
}
```

Necesitarías agregar inputs nuevos: `ingresoMensual`, `tarifaImpuestoRenta`, `aporteAFCMensual`.

### b) Ganancia ocasional al vender vivienda

Si vendes la vivienda después de 2 años de tenerla, hay un impuesto del 10% sobre la utilidad (con varias exenciones para vivienda principal). Para incluirlo, modifica el cálculo de `equity` final:

```javascript
const utilidadVivienda = valorVivienda - precioOriginal;
const impuestoVenta = Math.max(0, utilidadVivienda * 0.10 - exencion);
const equityNeto = valorVivienda - saldo - impuestoVenta;
```

### c) Retención sobre ganancias del ETF

Al vender el ETF (CSPX.L domiciliado en Irlanda), no hay retención de USA, pero sí hay impuesto de renta en Colombia sobre la ganancia. Aplica al `etf` final:

```javascript
const utilidadETF = etfFinal - aportadoTotal;
const impuestoETF = utilidadETF * 0.35;  // tarifa sobre rendimientos
const etfNeto = etfFinal - impuestoETF;
```

---

## 6. Soportar tasas en UVR

Las hipotecas UVR tienen una mecánica distinta: la tasa nominal es baja (ej. UVR + 4%) pero el saldo se actualiza por la UVR (≈ inflación). Es esencialmente una tasa real.

**Forma simple de modelarlo:**

1. Agregar un toggle "Pesos / UVR" en el control de tasa.
2. Si UVR, la tasa efectiva en pesos del crédito es aprox `(1 + tasaUVR) * (1 + inflacionEsperada) - 1`.
3. La cuota en pesos del primer mes se calcula con esa tasa equivalente; en años siguientes, la cuota crece con la UVR.

Esto requiere refactorizar `simulate()` para tener dos modalidades de cuota.

---

## 7. Persistir la configuración del usuario

Para que los valores no se pierdan al recargar:

### En `js/app.js`, después de `init()`:

```javascript
function saveState() {
  const state = UI.readInputs();
  localStorage.setItem('calc-state', JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem('calc-state');
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    document.getElementById('precio').value = state.precio / 1e6;
    document.getElementById('ci').value = state.cuotaInicialPct;
    // ... etc para todos los inputs
  } catch (e) {
    console.error('Estado guardado corrupto:', e);
  }
}

function init() {
  Charts.initAll();
  loadState();   // ← agregar antes de bindings
  bindSliders();
  bindPresets();
  recalcular();
}

// Después de cada recálculo
function recalcular() {
  // ... 
  saveState();
}
```

---

## 8. Exportar el resultado a PDF o Excel

### PDF

Usa la API nativa `window.print()` con un stylesheet `@media print`:

```css
@media print {
  .panel--controls, .presets, .preset-btn { display: none; }
  .panel--results { width: 100%; }
}
```

Y un botón "Imprimir resumen" que dispare `window.print()`.

Para algo más sofisticado: `jsPDF` + `html2canvas` (cargados por CDN).

### Excel

Genera un CSV con los datos anuales:

```javascript
function exportarCSV(result) {
  const headers = ['Año', 'Equity compra (M)', 'ETF arriendo (M)', 'Cuota', 'Arriendo'];
  const rows = result.yearly.map(y => [
    y.anio,
    (y.equity / 1e6).toFixed(2),
    (y.etf / 1e6).toFixed(2),
    (y.cuota / 1e6).toFixed(3),
    (y.arriendoEq / 1e6).toFixed(3)
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'simulacion.csv';
  a.click();
}
```

---

## 9. Trabajar con el plan de pagos (amortización)

`calculator.js` exporta dos funciones para el plan de pagos del banco, **independientes de `simulate()`** — solo cubren la hipoteca + seguros, no el ETF.

### `amortizationSchedule(input)`

Recibe los mismos inputs que `simulate()` (usa `precio`, `cuotaInicialPct`, `tasaEA`, `plazoAnios`, `seguroVidaPct`, `seguroIncendioPct`) y devuelve un array con una fila **por mes** (`plazoAnios × 12` filas):

```javascript
import { amortizationSchedule } from './js/calculator.js';

const plan = amortizationSchedule(input);
// plan[0] = {
//   mes: 1,
//   cuota,            // cuota fija del sistema francés (constante)
//   interes,          // saldo × tasaMensual
//   capital,          // cuota − interes
//   seguroVida,       // saldo × seguroVidaPct/100 (decrece con el saldo)
//   seguroIncendio,   // precio × seguroIncendioPct/100 (fijo)
//   cuotaTotal,       // cuota + seguroVida + seguroIncendio
//   saldo             // saldo pendiente al cierre del mes (≥ 0)
// }
```

### `scheduleTotals(schedule)`

Recibe la salida de `amortizationSchedule()` y suma cada columna a lo largo de todo el plazo:

```javascript
import { scheduleTotals } from './js/calculator.js';

const totales = scheduleTotals(plan);
// { interes, capital, cuota, seguroVida, seguroIncendio, cuotaTotal }
```

Útil para mostrar "cuánto pagás en total al banco" o "cuánto se va solo en intereses+seguros". Para una tabla en la UI, conviene agrupar las 240+ filas por año (sumando los 12 meses de cada uno) antes de renderizar.

---

## 10. Análisis de sensibilidad (goal seek y breakevens)

Responden la pregunta inversa: **¿en qué valor de una palanca cambia el resultado?** Ambas viven en `calculator.js`.

### `goalSeek(input, key, min, max)`

Busca, por bisección, el valor de la variable `key` que hace que `simulate(...).diferencia` cruce cero (el punto donde empata comprar vs arrendar):

```javascript
import { goalSeek } from './js/calculator.js';

// ¿Con qué retorno del ETF empatan los dos escenarios?
const umbral = goalSeek(input, 'retornoEtfUsdPct', 0, 18);
// → número (el valor de cruce) o null si no hay cruce en [min, max]
```

Hace hasta 50 iteraciones con tolerancia `1e-6`. Devuelve `null` cuando los extremos `min` y `max` no encierran un cruce (mismo signo de diferencia en ambos), así que **siempre validá contra `null`** antes de usar el resultado.

### `breakevens(input)`

Corre `goalSeek` sobre las palancas relevantes según el modo (`input.modo`) y devuelve los puntos de quiebre de cada una:

```javascript
import { breakevens } from './js/calculator.js';

const puntos = breakevens(input);
// [
//   { key: 'tasaEA',           umbral: 11.2,  actual: 10 },
//   { key: 'retornoEtfUsdPct', umbral: 7.4,   actual: 8 },
//   ...
// ]   // umbral puede ser null si esa palanca no cruza en su rango
```

Cada entrada trae `key` (la variable), `umbral` (valor de cruce o `null`) y `actual` (el valor actual del input). Para agregar una palanca nueva al análisis, sumala a `BREAKEVEN_VARS` en `calculator.js` con su `key`, `min`, `max` y los `modes` en que aplica.

---

## 11. Cómo trabajar con Claude para extender

Esta calculadora está diseñada para que sea fácil iterarla con un asistente de IA. Algunos consejos:

### Antes de pedir un cambio, pega el contexto relevante

No le des a Claude todo el código (es mucho). En su lugar, pégale:

1. **README.md** (para que entienda el proyecto)
2. **El archivo o archivos que cambian** (ej. `calculator.js` y `ui.js`)
3. **Tu pedido específico**

### Pide cambios atómicos, no rediseños

Mejor: "Agrega un input 'Tasa de impuesto sobre ganancia ETF' que reste impuestos del valor final del ETF" → Claude entrega un diff claro.

Peor: "Mejora la calculadora con todo lo que se te ocurra" → resultados impredecibles.

### Pide que respete la arquitectura

En tu prompt, incluye: "Respeta la separación de capas: la matemática va en `calculator.js`, la lectura del DOM en `ui.js`, los gráficos en `charts.js`. No mezcles."

### Si Claude propone un cambio grande, pídele que lo divida en pasos

"Antes de escribir código, dime los pasos en orden y por qué cada uno". Después: "OK, hazme solo el paso 1".

### Validar siempre los cálculos a mano

Para cualquier cambio en `calculator.js`, valida con un caso conocido. Por ejemplo: cuota mensual de $100M COP a 10% EA por 20 años debería ser ≈ $937k. Si Claude cambió algo y el número se aleja, pregúntale por qué.

### Plantilla de prompt útil

```
Tengo esta calculadora financiera vanilla JS [pega README.md].

Aquí está el archivo que quiero modificar:
[pega el archivo]

Quiero agregar [feature específica]. Respeta la separación de capas
descrita en el README. Dame el archivo modificado completo y explícame
los cambios al final.
```

---

¿Algo no está cubierto aquí? Pídeselo a Claude con el contexto adecuado y vuelve a actualizar este documento con la receta nueva.
