# Arquitectura

Este documento explica **cómo está organizado el código y por qué**. La regla mental: cada archivo tiene una sola responsabilidad y los flujos de datos van en una sola dirección.

---

## Flujo de datos en una línea

```
Usuario mueve un slider
   ↓
app.js dispara recalcular()
   ↓
ui.js lee los inputs del DOM y los normaliza
   ↓
calculator.js corre la simulación (matemática pura)
   ↓
ui.js + charts.js pintan el resultado en pantalla
```

El usuario solo interactúa con sliders y botones. Todo el trabajo es hacia adelante: nadie escribe en el DOM "hacia atrás" para luego releerlo. Esto hace la app fácil de razonar.

---

## Las cuatro capas

### 1. `calculator.js` — lógica financiera pura

**Qué hace:** corre la simulación mes a mes y devuelve un objeto `result` con todos los datos derivados.

**Qué NO hace:** no toca el DOM, no formatea strings, no sabe que existe Chart.js.

**Por qué importa:** podrías importar este archivo en Node, en un test unitario, en otra UI completamente distinta, y funcionaría igual. La lógica está aislada.

**API expuesta** (ESM `export` desde `js/calculator.js`):

| Función | Retorna | Para qué |
|---|---|---|
| `simulate(input)` | `result` con yearly[], final, etfFinalUsd, etfFinalUsdNeto, equityNeto, impuestos{}, diferencia, crossover, crossoverPatrimonio, etc. | El cálculo principal — implementa las dos capabilities |
| `monthlyPayment(P, rEA, n)` | número | Cuota mensual fija de hipoteca |
| `totalInterest(payment, years, P)` | número | Intereses totales |
| `eaToMonthly(eaPct)` | número | Conversión de tasa EA → mensual |
| `generarRecomendacion(result)` | string | Texto humano de lectura |
| `PRESETS` | objeto | Configuraciones rápidas (FNA Generación, FNA estándar, banca, FNA VIS) |

### 2. `ui.js` — capa de DOM y formato

**Qué hace:** lee inputs del DOM, los convierte a unidades estándar (COP, %, años), formatea números para mostrarlos, actualiza tarjetas de métricas y el bloque de recomendación.

**Qué NO hace:** no calcula nada financiero, no instancia ni manipula gráficos.

**Decisiones importantes:**

- `INPUT_CONFIG` es declarativo. Cada input tiene su unidad y su formateador. Si cambias cómo se muestra un valor, cambias solo el formateador.
- Los formateadores (`fmtCOP`, `fmtCOPCuota`, `fmtPct`) son la única forma autorizada de pasar números a pantalla. Si todos los componentes usan los mismos formateadores, la consistencia es automática.

**API expuesta** (ESM `export` desde `js/ui.js`):

| Función | Para qué |
|---|---|
| `readInputs()` | Devuelve un objeto listo para `Calculator.simulate()` (lee 18 sliders + 3 toggles defensivamente) |
| `refreshOutputs()` | Sincroniza los `<output>` con sus sliders |
| `applyPreset(name)` | Cambia múltiples sliders a la vez |
| `setMode(name)` | Cambia el modo de inversión ETF (tabs aporte-fijo / diferencia) |
| `updateMetrics(result)` | Pinta las 7 tarjetas de métricas |
| `updateRecommendation(result)` | Pinta el bloque de "lectura" |
| `fmtCOP, fmtCOPCuota, fmtPct, fmtUSD` | Formatters reutilizables |

### 3. `charts.js` — Chart.js

**Qué hace:** crea las tres instancias de Chart.js al iniciar y las actualiza cuando llega un nuevo `result`.

**Qué NO hace:** no calcula nada, no lee inputs.

**Decisiones importantes:**

- Los colores se leen de las CSS variables vía `getComputedStyle`. Esto significa que si cambias el theme, los charts se adaptan sin tocar JS.
- `update('none')` evita animaciones costosas en cada slide. Las animaciones se ven solo en el bootstrap inicial.
- Los datasets se inicializan vacíos en `initAll()`. La primera vez que se llama `updateAll()`, se llenan.

**API expuesta** (ESM `export` desde `js/charts.js`):

| Función | Cuándo llamar |
|---|---|
| `initAll()` | Una vez, en el bootstrap |
| `updateAll(result)` | En cada recálculo |

`charts.js` usa el global `Chart` (cargado por CDN en `index.html`), no lo importa explícitamente como módulo.

### 4. `app.js` — orquestador

**Qué hace:** conecta los listeners de los inputs, los presets, y la función central `recalcular()` que llama a todo en orden.

**Es chico a propósito.** Si app.js crece más de 100 líneas, probablemente algo se está mezclando que debería vivir en otra capa.

---

## La función central: `recalcular()`

```javascript
function recalcular() {
  UI.refreshOutputs();           // sincroniza textos junto a sliders
  const inputs = UI.readInputs(); // lee y normaliza valores del DOM
  const result = Calculator.simulate(inputs); // matemática
  UI.updateMetrics(result);       // 5 tarjetas
  UI.updateRecommendation(result);// texto de lectura
  Charts.updateAll(result);       // 3 charts
}
```

Cinco líneas. Cada `input` event de un slider la dispara. Es una recálculo completo, no incremental — es perfectamente rápido para 240 iteraciones (20 años × 12 meses) y simplifica enormemente la mente.

---

## El objeto `result`

Es el "contrato" entre `calculator.js` y todo lo demás. Su forma es estable; si la cambias, hay que actualizar `ui.js` y `charts.js`.

```javascript
{
  input: { ...los inputs originales },
  cashInicial: 39000000,
  monto: 225000000,
  cuota: 2107439,
  totalIntereses: 281000000,
  yearly: [
    // Cada snapshot anual. Ver §13 de FORMULAS.md para todos los campos.
    { anio: 0, equity: 0, etf: 39000000,
      etfValorUsd, aportadoAcumUsd,               // valor USD con interés compuesto vs aportes acum. sin crecimiento (chart Interés compuesto)
      cuota, arriendoEq,
      costoCompraMes, costoArriendoMes,           // costo mensual total (cuota+admin / arriendo+admin)
      gastoCompraSunkAcum, gastoArriendoAcum,      // gasto NO recuperable acumulado (chart Plata perdida)
      aporteAnualUsd,                              // aporte mensual al ETF sumado en el año (chart Aporte ETF)
      cargaCompraPct, cargaArriendoPct,            // costo mensual como % del salario (chart Carga financiera)
      saldo, valorVivienda, intAnio: 0, capAnio: 0 },
    { anio: 1,  equity: 40e6, etf: 51e6,      ... },
    ...
    { anio: 20, equity: 603e6, etf: 451e6,    ... }
  ],
  final: { ...el último año },
  // ETF en USD (capability etf-investment-mode)
  etfFinalUsd: 43287,           // saldo final en USD nominal
  // Modelo de impuestos al cierre (capability tax-and-exit-cost-model)
  etfFinalUsdNeto: 28810,        // ETF USD después de impuesto sobre rendimientos
  equityNeto: 572_400_000,       // equity COP después de costos venta + ganancia ocasional
  impuestos: {
    rentaEtf: 14477,             // USD: utilidad × tarifa marginal
    gananciaVivienda: 0,         // COP: 0 si vivienda primera con exención cubre la utilidad
    costosVenta: 30_100_000,     // COP: % × valor final
    refundAfcTotalCop: 0         // COP: refund AFC acumulado (solo si aporteAfcMensual > 0)
  },
  // Crossovers (tres métricas distintas — ver Outputs en README)
  crossover: 9,                  // año arriendo > cuota mensual (cost crossover)
  crossoverPatrimonio: 13,       // año equity ↔ etf (wealth crossover)
  spendingCrossoverYear: 11,     // año en que el gasto sunk de arrendar supera al de comprar
  diferencia: 152000000,          // post-tax si aplicarImpuestos ON, bruta si OFF
  gana: 'compra'                 // o 'arriendo'
}
```

**Inputs solo de visualización**: `salarioMensual` y `crecimientoSalarialPct` alimentan únicamente los campos `cargaCompraPct` / `cargaArriendoPct` del chart de carga financiera. NO afectan el patrimonio, los impuestos ni la `diferencia`.

**Las dos capabilities especificadas formalmente** (en `openspec/specs/`) gobiernan los grupos de campos:
- `etf-investment-mode` — el portafolio en USD, el modo de inversión, el toggle de cashInicial, el FX engine
- `tax-and-exit-cost-model` — los campos `etfFinalUsdNeto`, `equityNeto`, `impuestos`, y la lógica del toggle `aplicarImpuestos`

Si quieres agregar un nuevo cálculo derivado, este es el lugar — agrégalo dentro de `simulate()` y lo expones aquí. Después en `ui.js` o `charts.js` puedes consumirlo.

---

## Modo claro / oscuro

Funciona automáticamente vía `prefers-color-scheme`. Las CSS variables redefinen sus valores en `@media (prefers-color-scheme: dark)`, y los charts leen esas variables al inicializarse.

**Caveat:** los charts NO escuchan cambios de tema en vivo. Si el usuario cambia el modo del sistema operativo mientras la app está abierta, los charts mantendrán los colores con los que se inicializaron. Si quisieras soportar cambio en vivo, agregarías un listener:

```javascript
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  // destruir y recrear los charts, o actualizar colores manualmente
});
```

---

## Tests

El proyecto tiene **106 tests automatizados** con Vitest, organizados en 15 archivos bajo `tests/`. Corren en menos de medio segundo.

```
tests/
├── admin-split.test.js         # Split de admin comprador vs arrendatario
├── calculator.test.js          # simulate() + utility functions (incluye spec scenarios de etf-investment-mode)
├── compound-interest.test.js   # Series de interés compuesto del ETF (etfValorUsd / aportadoAcumUsd)
├── contribution.test.js        # Aporte mensual al ETF y step-up anual
├── crossover-bug.test.js       # Regression guard del cost-crossover bug
├── crossover-metrics.test.js   # Patrimonio crossover
├── formatters.test.js          # fmtCOP, fmtCOPCuota, fmtPct, fmtUSD
├── goal-seek.test.js           # goalSeek() y breakevens()
├── insurance.test.js           # Seguros de vida (saldo) e incendio (valor)
├── presets.test.js             # Presets de escenario
├── salary-burden.test.js       # Carga financiera sobre el salario
├── schedule.test.js            # amortizationSchedule() y scheduleTotals()
├── scorecard.test.js           # Métricas del scorecard
├── spending.test.js            # Gasto no recuperable acumulado
└── tax-model.test.js           # Modelo de impuestos + AFC (capability tax-and-exit-cost-model)
```

### Workflow TDD

Para features nuevas:
1. **RED** — escribí los tests primero. Deben fallar (la funcionalidad no existe).
2. **GREEN** — implementá lo mínimo para que pasen.
3. **REFACTOR** — limpiá el código con confianza, los tests son tu red de seguridad.

Ejemplo del workflow:
```js
import { simulate, monthlyPayment } from './calculator.js';

test('FORMULAS §10: $100M / 10% EA / 20y ≈ $937k', () => {
  expect(monthlyPayment(100_000_000, 10, 20)).toBeCloseTo(937000, -3);
});
```

### Comandos

```bash
npm install      # primera vez
npm test         # corre todo (~440ms)
npm run test:watch  # re-corre al cambiar archivos
```

### Por qué `calculator.js` es trivial de testear

Las funciones son **puras**: `simulate(input) → result`. Cero mocks, cero side effects, cero DOM. Esa es la razón concreta por la que la separación de capas (matemática separada de DOM) vale el costo de mantenerla.

### Capabilities con spec formal

El proyecto tiene 2 capabilities especificadas en `openspec/specs/`:
- **`etf-investment-mode`** — define los dos modos de inversión, el toggle de cashInicial, y el motor FX
- **`tax-and-exit-cost-model`** — define el modelo de impuestos al cierre y el refund AFC

Cada capability tiene scenarios Given/When/Then que se traducen 1-a-1 a tests en Vitest.
