# Tasks: add-vitest (testing + ESM migration)

## Phase 1: Tooling setup

- [x] 1.1 Create `package.json` at project root with `name: "calculadora"`, `type: "module"`, `private: true`, `devDependencies: { vitest: "^2.0.0" }`, `scripts: { test: "vitest run", "test:watch": "vitest" }`.
- [x] 1.2 Create `vitest.config.js` at project root: `import { defineConfig } from 'vitest/config'; export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.js'] } });`.
- [x] 1.3 Create `.gitignore` at project root with one line: `node_modules/`.
- [x] 1.4 Run `npm install` to install Vitest + create `node_modules/`. Confirm `npx vitest --version` works.

## Phase 2: ESM migration

- [x] 2.1 `js/calculator.js`: remove `(function (global) { 'use strict'; ... })(typeof window !== 'undefined' ? window : globalThis);` wrapper. Drop the `global.Calculator = {...}` export at bottom. Replace with a single `export { simulate, monthlyPayment, totalInterest, eaToMonthly, generarRecomendacion, PRESETS };` at the bottom.
- [x] 2.2 `js/ui.js`: same wrapper removal. At the top, add `import * as Calculator from './calculator.js';`. Replace internal references to `global.Calculator.X` with `Calculator.X` (drop the `global.` prefix). Replace `global.UI = {...}` with `export { readInputs, refreshOutputs, applyPreset, setMode, updateMetrics, updateRecommendation, fmtCOP, fmtCOPCuota, fmtPct, fmtUSD, INPUT_CONFIG };`.
- [x] 2.3 `js/charts.js`: same wrapper removal. No JS imports needed (uses global `Chart` from CDN — leave as-is, the CDN script tag in `index.html` runs first). Replace `global.Charts = { initAll, updateAll };` with `export { initAll, updateAll };`.
- [x] 2.4 `js/app.js`: same wrapper removal. At the top, add three imports: `import * as Calculator from './calculator.js';`, `import * as UI from './ui.js';`, `import * as Charts from './charts.js';`. Internal references to `Calculator.X`, `UI.X`, `Charts.X` stay the same (just drop the implicit window dependency).
- [x] 2.5 `index.html`: replace the four `<script src="js/...">` tags with a single `<script type="module" src="js/app.js"></script>`. Keep the Chart.js CDN tag BEFORE it (Chart.js needs to be in global scope when `charts.js` evaluates).

## Phase 3: Tests

- [x] 3.1 `tests/calculator.test.js`:
   - `eaToMonthly`: 10% EA → 0.007974 (±0.0001); 0% → 0; edge cases.
   - `monthlyPayment`: $100M / 10% EA / 20y → ≈$937k (±$1k, FORMULAS §10); $200M / 8% / 15y → ≈$1.86M; 0% rate → exact division.
   - `totalInterest`: identity check.
   - `simulate` — 14 spec scenarios from `etf-investment-mode/spec.md` translated mechanically: FX Rate Engine (initial rate, constant FX, 20y compounding ≈$7588.94 ±0.5%), Diferencia Mode (cost diff conversion, zero contrib), Aporte Fijo (USD direct, step-up at m=13, zero contrib), Cash Toggle (ON converts COP→USD, OFF=0), ETF USD Reporting (etfFinalUsd present).
   - At least 1 sanity test combining all defaults to confirm the simulate() pipeline doesn't blow up.
- [x] 3.2 `tests/formatters.test.js`:
   - `fmtCOP`: zero, 500k, 1.5M, 1B, negative; rounding with decimals param.
   - `fmtCOPCuota`: typical mortgage values.
   - `fmtPct`: zero decimals, 1 decimal, edge negatives.
   - `fmtUSD`: zero, $250, $9285.71 (rounded), $43287, large numbers with thousands separator.
- [x] 3.3 `tests/crossover-bug.test.js`: with defaults, find the first year `a > 0` where `yearly[a].costoArriendoMes > yearly[a].costoCompraMes` and assert it equals `result.crossover` (within 1-year tolerance for snapshot timing). EXPECTED to FAIL currently — captures the bug for the next change. Add a second test with non-default values (precio=400M, arr=$2.5M) to make the bug reproducible regardless of input.

## Phase 4: Documentation

- [x] 4.1 `README.md`: add a new section "## Cómo correr los tests" between "Stack" and "Estructura de archivos". Three bullet points: (1) `npm install`, (2) `npm test` (single run), (3) `npm run test:watch` (watch mode). Brief note: tests cubren la matemática pura de `calculator.js` y los formatters de `ui.js`. Note about HTTP serve: agregar línea en "¿Cómo correrla?" recomendando `python3 -m http.server 8080` ahora que index.html usa modules y `file://` puede ser estricto.

## Phase 5: Manual verification

- [x] 5.1 `npm test` corre ~40+ tests; ALL pass EXCEPT `crossover-bug.test.js` (which fails red, by design).
- [x] 5.2 Open the app via `python3 -m http.server 8080` (or `npx serve`); load `http://localhost:8080`.
- [x] 5.3 Verify zero console errors on page load.
- [x] 5.4 Drag every slider in BOTH modes; switch tabs; toggle cashInicial. App behaves identically to pre-migration. Numbers match what we saw before this change.
- [x] 5.5 Confirm the 5 metrics + new "ETF final (USD)" all render and update.
- [x] 5.6 Confirm all 3 charts render and respond to slider changes.
