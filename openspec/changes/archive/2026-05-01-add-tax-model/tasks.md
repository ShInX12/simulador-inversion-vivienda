# Tasks: add-tax-model (TDD strict)

## Phase 1: Tests FIRST — must FAIL before implementation (RED)

- [x] 1.1 Create `tests/tax-model.test.js`. Import `simulate` from `../js/calculator.js`. Define a `taxDefaults` helper combining the calculator defaults with all 6 new tax fields at their defaults (`aplicarImpuestos: true`, `tarifaRentaMarginal: 33`, `tarifaGananciaViviendaPct: 10`, `costoVentaViviendaPct: 5`, `viviendaPrimera: true`, `aporteAfcMensual: 0`).
- [x] 1.2 **Toggle Tests** (2): (a) with `aplicarImpuestos=false`, assert `result.diferencia === result.final.equity - result.final.etf` AND `result.equityNeto`/`result.etfFinalUsdNeto`/`result.impuestos` are still defined. (b) with `aplicarImpuestos=true`, assert `result.diferencia` is computed from `equityNeto - etfFinalUsdNeto × tasa_240` (tasa_240 derived from `yearly[20].etf / etfFinalUsd`).
- [x] 1.3 **Aportado Total invariant** (1): aporte-fijo, USD aporte=250, no growth, no AFC, no seed, ipc=0 → `result.impuestos.rentaEtf === 0` (because etfFinalUsd === aportadoTotalUsd). Indirect check: `result.etfFinalUsdNeto === result.etfFinalUsd`.
- [x] 1.4 **ETF Liquidation Tax** (2): (a) with growth (etf=8% USD): assert `impuestos.rentaEtf > 0` AND `etfFinalUsdNeto < etfFinalUsd`; numerically, `impuestos.rentaEtf ≈ (etfFinalUsd - aportadoTotalImplicit) × 0.33` where aportadoTotalImplicit can be derived from setup. (b) negative/zero utility scenario: aporte=0, etf=0%, dev=0, toggle=ON → `impuestos.rentaEtf === 0`.
- [x] 1.5 **AFC Refund** (2): (a) `aporteAfcMensual=1_000_000`, tarifa=33, dev=0 → after year 1 (`yearly[1].etf` setup with all-USD-zero scenario), the AFC contribution must add `12×1_000_000×0.33/4200 ≈ 942.857` USD. Easier integration: `impuestos.refundAfcTotalCop` after 20 years === `1_000_000 × 12 × 20 × 0.33 = 79_200_000`. (b) `aporteAfcMensual=0` → `impuestos.refundAfcTotalCop === 0`.
- [x] 1.6 **Vivienda Primera Exemption** (2): (a) `viviendaPrimera=true`, defaults → `impuestos.gananciaVivienda === 0` (exención cubre utilidad). (b) `viviendaPrimera=false`, defaults → `impuestos.gananciaVivienda === (final.valorVivienda - input.precio) × 0.10`.
- [x] 1.7 **Sale Costs + equityNeto** (1): with defaults, `impuestos.costosVenta === final.valorVivienda × 0.05`. Verify `equityNeto ≈ final.valorVivienda - final.saldo - impuestos.gananciaVivienda - impuestos.costosVenta`.
- [x] 1.8 **Result Extension** (1): with defaults, `etfFinalUsdNeto`, `equityNeto`, `impuestos.{rentaEtf, gananciaVivienda, costosVenta, refundAfcTotalCop}` are all defined finite numbers.
- [x] 1.9 Run `npm test`. Confirm all NEW tax-model tests FAIL (red), and the 44 existing tests still PASS.

## Phase 2: Implementation in `js/calculator.js` — drive tests to GREEN

- [x] 2.1 Extend `simulate()` destructuring with the 6 new inputs (defaults: 33, 10, 5, true, true, 0). Add the constant `UVT_BASE_COP = 51_000` near the top of the file.
- [x] 2.2 Initialize `let aportadoTotalUsd = invertirCashInicial ? cashInicial / tasaCopUsdInicial : 0;` and `let refundAfcTotalCop = 0;` before the month loop.
- [x] 2.3 Inside the contribution branch: after `etfUsd += dif/tasaActual` (or `+= aporteActualUsd`), also `aportadoTotalUsd += <same amount>`. Critical for tax basis correctness.
- [x] 2.4 At year-end (`m % 12 === 0`) inside the loop, BEFORE the snapshot push, if `aporteAfcMensual > 0`: compute `refundCop = aporteAfcMensual × 12 × tarifaRentaMarginal/100`; `refundUsd = refundCop / tasaActual`; `etfUsd += refundUsd`; `aportadoTotalUsd += refundUsd`; `refundAfcTotalCop += refundCop`.
- [x] 2.5 After the loop, compute: `utilidadEtfUsd = max(0, etfUsd - aportadoTotalUsd)`; `impuestoEtfUsd = utilidadEtfUsd × tarifaRentaMarginal/100`; `etfFinalUsdNeto = etfUsd - impuestoEtfUsd`.
- [x] 2.6 Compute vivienda exits: `utilidadVivienda = final.valorVivienda - precio`; `exencionVivienda = viviendaPrimera ? 7500 × UVT_BASE_COP × Math.pow(1 + ipcPct/100, plazoAnios) : 0`; `utilidadGravable = max(0, utilidadVivienda - exencionVivienda)`; `impuestoGananciaVivienda = utilidadGravable × tarifaGananciaViviendaPct/100`; `costosVenta = final.valorVivienda × costoVentaViviendaPct/100`; `equityNeto = max(0, final.valorVivienda - final.saldo - impuestoGananciaVivienda - costosVenta)`.
- [x] 2.7 Compute the new diferencia: `diferenciaFinal = aplicarImpuestos ? (equityNeto - etfFinalUsdNeto × tasaActual) : (final.equity - final.etf)`. Update return object: replace `diferencia` value, ADD `etfFinalUsdNeto`, `equityNeto`, `impuestos: { rentaEtf: impuestoEtfUsd, gananciaVivienda: impuestoGananciaVivienda, costosVenta, refundAfcTotalCop }`. Update `gana` based on the new diferencia.
- [x] 2.8 Update JSDoc with the 6 new params.
- [x] 2.9 Run `npm test`. Confirm all 11 new tax-model tests PASS, plus the 44 existing tests still PASS.

## Phase 3: Update existing tests if any broke

- [x] 3.1 Re-run `npm test`. If any of the 44 existing tests broke (likely the `gana`-dependent smoke test), either pass `aplicarImpuestos: false` to those tests, or update assertions against the new fields. Document the change.

## Phase 4: UI layer — `js/ui.js`

- [x] 4.1 Add 4 entries to `INPUT_CONFIG`: `tarifaRenta` (pct, fmtPct(v,0)), `tarifaGanancia` (pct, fmtPct(v,0)), `costoVenta` (pct, fmtPct(v,0)), `aporteAfc` (k-COP unit, format `'$' + v + 'k'`).
- [x] 4.2 Extend `readInputs()` to read the 6 new fields. Sliders via `get()`, toggles via `document.getElementById('viviendaPrimeraToggle').checked` and `document.getElementById('aplicarImpuestosToggle').checked`. Map `aporteAfc` slider to COP via `× 1000`.

## Phase 5: Wiring — `js/app.js`

- [x] 5.1 Extend `bindToggle()` (or add `bindTaxToggles()`) to also bind `change` on `#viviendaPrimeraToggle` and `#aplicarImpuestosToggle` to `recalcular()`.

## Phase 6: HTML — `index.html`

- [x] 6.1 Insert a new `<section class="control-group">` titled "Impuestos y costos al cierre" after "Inversión alternativa". Inside: 4 sliders (`tarifaRenta` 0-40 step 1 default 33, `tarifaGanancia` 0-20 step 1 default 10, `costoVenta` 0-10 step 0.5 default 5, `aporteAfc` 0-3000 step 50 default 0) plus 2 `<label class="toggle">` checkboxes (`viviendaPrimeraToggle` checked, `aplicarImpuestosToggle` checked). Add hint copy explaining each input briefly.

## Phase 7: Manual verification

- [x] 7.1 `npm test`: 55+ tests, all green.
- [x] 7.2 Open browser via `http.server`. Default load: "Diferencia final" reflects post-tax (will be different from pre-change).
- [x] 7.3 Toggle "Aplicar impuestos al cierre" OFF → "Diferencia final" reverts to pre-change number (regression invariant).
- [x] 7.4 Toggle "Vivienda primera" OFF → "Diferencia final" decreases (vivienda tax now applies).
- [x] 7.5 Move "Aporte AFC" slider to non-zero → "Diferencia final" shifts in favor of arrendar.
- [x] 7.6 Move each new slider; no console errors; all 6 metrics + 3 charts render correctly.
