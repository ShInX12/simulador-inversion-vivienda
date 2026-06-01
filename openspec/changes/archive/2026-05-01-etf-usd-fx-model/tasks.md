# Tasks: ETF USD/FX model

## Phase 1: calculator.js — refactor del motor

- [x] 1.1 Extend `simulate()` destructuring: add `tasaCopUsdInicial = 4200`, `devaluacionAnualPct = 3`. Rename `retornoEtfPct` → `retornoEtfUsdPct` with default `8`. Rename `aporteMensual` → `aporteMensualUsd` with default `250`.
- [x] 1.2 Add `const devalMensual = eaToMonthly(devaluacionAnualPct);`. Rename local `etfMensual` → `etfUsdMensual` (now means USD nominal monthly return).
- [x] 1.3 Replace `let etf = invertirCashInicial ? cashInicial : 0` with `let etfUsd = invertirCashInicial ? cashInicial / tasaCopUsdInicial : 0`. All references to `etf` (the variable, not the field name) become `etfUsd`.
- [x] 1.4 Insert `let tasaActual = tasaCopUsdInicial;` immediately before the month loop (this is `tasa_0`).
- [x] 1.5 Update `yearly[0]` entry: `etf: etfUsd * tasaCopUsdInicial` (COP equivalent at month 0).
- [x] 1.6 Rename `aporteActual` → `aporteActualUsd = aporteMensualUsd`.
- [x] 1.7 At the top of the month loop, BEFORE any other logic that uses `tasa`, add `tasaActual *= 1 + devalMensual;` so it represents `tasa_m`.
- [x] 1.8 Refactor the contribution branch: in `diferencia` mode, `const dif = costoCompra - costoArriendo; if (dif > 0) etfUsd += dif / tasaActual;`. In `aporte-fijo` mode, `etfUsd += aporteActualUsd;`. After the branch, `etfUsd *= 1 + etfUsdMensual;`.
- [x] 1.9 In the year-end snapshot block, set `etf: etfUsd * tasaActual` (COP equivalent at end of year `a`).
- [x] 1.10 In the returned result object, add `etfFinalUsd: etfUsd` after `final`.
- [x] 1.11 Update the JSDoc for `simulate()` to add the 2 new params and document the unit/semantic changes for `retornoEtfUsdPct` and `aporteMensualUsd`.

## Phase 2: ui.js — formatter, INPUT_CONFIG, readInputs

- [x] 2.1 Add `fmtUSD(v)` formatter: `'$' + v.toLocaleString('en-US')`. Export it on `window.UI`.
- [x] 2.2 Update `INPUT_CONFIG`: change `aporte` to `{ unit: 'usd', format: (v) => fmtUSD(v) }`. Change `etf` hint text indirectly via HTML (no `INPUT_CONFIG` change). Add `fxi` entry: `{ unit: 'cop-rate', format: (v) => '$' + v.toLocaleString('en-US') }`. Add `dev` entry: `{ unit: 'pct', format: (v) => fmtPct(v, 1) }`.
- [x] 2.3 Update `readInputs()`: replace `aporteMensual: get('aporte') * 1000` with `aporteMensualUsd: get('aporte')`. Add `tasaCopUsdInicial: get('fxi')`, `devaluacionAnualPct: get('dev')`. Rename returned key `retornoEtfPct` → `retornoEtfUsdPct: get('etf')`.
- [x] 2.4 Update `updateMetrics()`: render new metric `m-etf-usd` showing `result.etfFinalUsd` formatted via `fmtUSD`.

## Phase 3: index.html — sliders + metric card

- [x] 3.1 Modify the existing `#aporte` slider: change `min="0" max="5000" step="50" value="500"` → `min="0" max="1000" step="10" value="250"`. Change label "Aporte mensual al ETF" → "Aporte mensual al ETF (USD)". Change `<output>` default text `$500k` → `$250`. Update hint to mention USD.
- [x] 3.2 Modify the existing `#etf` slider: change `value="10"` → `value="8"`. Update label "Retorno ETF en COP" → "Retorno ETF en USD". Update hint: `CSPX.L histórico ~10% USD nominal · 8% es conservador forward-looking`.
- [x] 3.3 Insert two new sliders inside "Inversión alternativa", AFTER the `#etf` slider and BEFORE the `#aporte` slider: `#fxi` (`min=3000 max=6000 step=50 value=4200`, label "Tasa COP/USD inicial", hint "Cotización al día cero. Histórico reciente: $4,000–$4,500.") and `#dev` (`min=0 max=8 step=0.25 value=3`, label "Devaluación anual COP/USD", hint "Promedio histórico colombiano ~3-4%.").
- [x] 3.4 Add a 6th metric card to the `<div class="metrics">` section: `<article class="metric"><p class="metric__label">ETF final (USD)</p><p class="metric__value" id="m-etf-usd">$0</p></article>`. Place it between "Intereses totales" and "Año del cruce" so the highlight (Diferencia final) stays last.

## Phase 4: Verification (manual — uses exact numbers from spec scenarios)

- [x] 4.1 **FX engine constant** (dev=0): set `dev=0`. Add temp `console.log(m, tasaActual)` at top of loop. Expected: tasaActual stays exactly 4200 for m=1..240. Remove log.
- [x] 4.2 **FX engine compounding** (dev=3, year 20): set `dev=3`. Temp log only at m=240. Expected: ~$7,588.94 (within 0.5% = $7,551–$7,627). Remove log.
- [x] 4.3 **Aporte fijo USD step-up**: set aporte=$250, incr=8%. Temp log aporteActualUsd at m=12, 13, 24, 25. Expected: 250, 270, 270, 291.6. Remove log.
- [x] 4.4 **Diferencia → USD conversion**: set modo='diferencia' with default sliders. Temp log `(dif, tasaActual, dif/tasaActual)` at m=1. With defaults at m=1, dif ≈ COP positive value; verify dif/tasaActual gives a sensible USD amount (~$100–$200). Remove log.
- [x] 4.5 **Cash inicial conversion**: with toggle ON and defaults, the simulation's initial `etfUsd` should equal `cashInicial / 4200`. Temp log etfUsd before the loop. Expected: with default $39M COP cashInicial → ~$9,285.71. Remove log.
- [x] 4.6 **New metric**: visually confirm "ETF final (USD)" appears in the metrics row. Drag aporte slider; the USD metric should respond live without console errors.
- [x] 4.7 **Pure compounding sanity**: aporte=0, dev=0, toggle=ON, etf=8%. Year 20 ETF (USD) ≈ `9285.71 × 1.08^20 ≈ $43,287 USD`. In COP at constant 4200 → ~$181.8M. Compare both metrics (chart endpoint + new USD metric).
- [x] 4.8 **Visual smoke test**: drag every slider in BOTH modes. Switch tabs ida y vuelta. Toggle cash on/off. No console errors, charts re-render, layout intact.
