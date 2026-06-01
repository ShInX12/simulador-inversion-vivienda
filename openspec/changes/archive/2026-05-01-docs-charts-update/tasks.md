# Tasks: docs-charts-update

## Phase 1: README.md

- [x] 1.1 In "Variables que considera", add a new "### Tu salario" group after "Impuestos y costos al cierre": Salario mensual ($5M default, $1M–$30M) and Crecimiento anual del salario (5% default, 0–15%). Note both are visualization-only (no afectan la Diferencia final).
- [x] 1.2 In "Outputs que produce", replace the "Más tres gráficos" block with the actual 6 charts: (1) Patrimonio neto, (2) Composición del pago anual, (3) Costo mensual comprar vs arrendar, (4) Plata perdida (sunk costs), (5) Aporte anual al ETF, (6) Carga financiera (% del salario).

## Phase 2: docs/FORMULAS.md

- [x] 2.1 Add a new section "## 13. Campos derivados en `yearly[]`" documenting every field in each yearly snapshot: anio, equity, etf (COP eq.), cuota, arriendoEq, costoCompraMes, costoArriendoMes, gastoCompraSunkAcum, gastoArriendoAcum, aporteAnualUsd, cargaCompraPct, cargaArriendoPct, saldo, valorVivienda, intAnio, capAnio. One line each explaining what it is and which chart consumes it.

## Phase 3: docs/ARCHITECTURE.md

- [x] 3.1 Update the "El objeto `result`" yearly[] shape to include the new fields (costoCompraMes, costoArriendoMes, gastoCompraSunkAcum, gastoArriendoAcum, aporteAnualUsd, cargaCompraPct, cargaArriendoPct). Add a note that salarioMensual + crecimientoSalarialPct are inputs that feed only cargaXPct (visualization-only).

## Phase 4: Verification

- [x] 4.1 `npm test` — confirm 72 still passing (regression invariant).
- [x] 4.2 Read all 3 files end-to-end. Cross-check:
   - README salary group matches ui.js INPUT_CONFIG (salario, crecSal) + index.html sliders
   - README 6 charts match the 6 <figure> blocks / 6 canvas ids (cMain, cAmort, cRent, cGasto, cAporte, cCarga)
   - FORMULAS §13 fields match the yearly.push() in calculator.js exactly
   - ARCHITECTURE result shape matches simulate() return
