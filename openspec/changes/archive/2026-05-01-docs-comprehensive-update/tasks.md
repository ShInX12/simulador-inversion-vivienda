# Tasks: docs-comprehensive-update

## Phase 1: `README.md`

- [x] 1.1 Update "Variables que considera" table. After "Retorno ETF en COP" row (which should rename to "Retorno ETF en USD" with default 8%), modify the existing aporte/incremento rows to clarify USD unit. Add new rows: Tasa COP/USD inicial, Devaluación anual COP/USD, Aporte mensual al ETF (USD), Tarifa marginal de renta, Ganancia ocasional vivienda, Costos de venta vivienda, Aporte AFC mensual. Add toggle row for Aplicar impuestos and Vivienda primera.
- [x] 1.2 Update "Outputs que produce" section. Items should be: Cuota mensual, Cash al cierre, Intereses totales, ETF final (USD), Año arriendo > cuota (rename from Año del cruce), Cruce de patrimonio (NEW), Diferencia final (note: post-tax by default).
- [x] 1.3 Update "Limitaciones conocidas del modelo". Remove: Impuestos (renta sobre rendimientos ETF, ganancia ocasional vivienda — now modeled). Remove: Beneficio AFC (now modeled, simplified — AFC balance not tracked). Refine remaining: mantenimiento, riesgo cambiario explícito (FX is deterministic, not stochastic; volatility not modeled), costos transacción venta (now modeled at close), inflación salario.

## Phase 2: `docs/FORMULAS.md`

- [x] 2.1 Rewrite §5 (Interés compuesto del ETF). New content describes:
  - ETF lives in USD throughout
  - Per-month: ETF = ETF × (1 + r_USD_mensual) + aporte_USD
  - aporte_USD depends on `modo`: diferencia → max(0, costoCompra-costoArriendo)/tasa_m; aporte-fijo → aporteMensualUsd con step-up anual
  - cashInicial seeding: cashInicial / tasaCopUsdInicial al mes 0 si toggle ON
  - For chart/comparison: etf in COP = etfUsd × tasa_actual
- [x] 2.2 Fix §10 sanity table. Change "$200M COP, 8% EA, 15 años | Cuota ≈ $1.86M" to "$1,879,212 (~$1.88M)". Add note: "Doc anterior decía $1.86M — aproximación off por ~1%. La fórmula exacta da $1.879M."
- [x] 2.3 Add NEW §11 "FX rate engine". Content:
  - tasa_m = tasaCopUsdInicial × (1 + devalMensual)^m
  - devalMensual = (1 + devaluacionAnualPct/100)^(1/12) − 1
  - Default: COP/USD inicial 4200, devaluación 3%/año → tasa_240 ≈ 7588.94
  - Mention que el modelo es determinista (no Monte Carlo)
- [x] 2.4 Add NEW §12 "Tax model + AFC". Content:
  - Toggle aplicarImpuestos (default ON)
  - ETF tax: utilidadEtfUsd × tarifaRentaMarginal/100. utilidadEtfUsd = etfFinalUsd − aportadoTotalUsd
  - Vivienda tax: ganancia ocasional 10% sobre (utilidadVivienda − exencionVivienda). Exención: 7500 × UVT_BASE × (1+ipc)^plazo si viviendaPrimera
  - Costos venta: porcentaje × valor final
  - AFC refund: aporteAfcMensual × 12 × tarifaRenta/100 al year-end (renter only). Va al ETF en USD a la tasa del mes
  - Limitación: AFC balance NO trackeado, solo el refund

## Phase 3: `docs/ARCHITECTURE.md`

- [x] 3.1 Replace "Por qué no hay tests" section with new "## Tests" section. Content: "El proyecto tiene 58 tests automatizados con Vitest. Corren en <500ms. Estructura en `tests/`: calculator.test.js (math + 14 spec scenarios), formatters.test.js, crossover-bug.test.js (regression guard), tax-model.test.js (11 scenarios TDD-first), crossover-metrics.test.js (3 scenarios). Workflow TDD: escribir tests primero (red), implementar (green), refactor con confianza. Comando: `npm test` o `npm run test:watch`."
- [x] 3.2 Update the result object shape diagram in the "El objeto `result`" section. Add fields: etfFinalUsd, etfFinalUsdNeto, equityNeto, impuestos: { rentaEtf, gananciaVivienda, costosVenta, refundAfcTotalCop }, crossoverPatrimonio. Note that crossover is now "cost crossover (arriendo > cuota mensual)" while crossoverPatrimonio is "wealth crossover (equity vs etf flip)".
- [x] 3.3 Update the "Las cuatro capas" section briefly: in calculator.js description, mention that simulate() now returns 14+ fields including USD-denominated ETF values and a tax breakdown. Mention the second capability `tax-and-exit-cost-model` alongside `etf-investment-mode`.

## Phase 4: Manual verification

- [x] 4.1 Run `npm test` — confirm 58 still passing (regression invariant: docs change should not break code).
- [x] 4.2 Read README.md end-to-end. Cross-check:
  - Variables table count matches `INPUT_CONFIG` (currently 18 entries) plus 2 toggles
  - Outputs section lists 7 metrics
  - Limitaciones section is accurate (no double-counting of things now modeled)
- [x] 4.3 Read FORMULAS.md end-to-end. Cross-check:
  - §5 describes the actual code path in `simulate()` for ETF math
  - §10 sanity values match what `tests/calculator.test.js` asserts
  - §11 FX engine math matches `js/calculator.js:tasaActual` logic
  - §12 tax math matches `js/calculator.js` post-loop math + matches `openspec/specs/tax-and-exit-cost-model/spec.md`
- [x] 4.4 Read ARCHITECTURE.md end-to-end. Cross-check:
  - "Tests" section accurately describes the test files
  - Result object shape matches `js/calculator.js` return statement
  - 4-layer description still accurate
