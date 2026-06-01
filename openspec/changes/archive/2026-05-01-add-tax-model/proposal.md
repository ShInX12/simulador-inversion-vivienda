# Proposal: Add tax + exit-cost model

## Intent

The calculator's "Diferencia final" metric is currently in **pre-tax, gross-of-exit-cost** terms. For a Colombian user actually deciding "comprar o arrendar+invertir", taxes and sale costs at year 20 can shift the answer by tens of millions of pesos. The renter pays renta-marginal on ETF rendimientos (~33% in Colombia), the buyer pays ganancia ocasional + comisión inmobiliaria when selling. Without modeling these, the calculator overstates the "arrendar+invertir" winner case.

This change converts "Diferencia final" into a realistic post-tax, post-exit-cost number — what the user **actually has in their hand** at year 20 — and adds the AFC tax-refund benefit that nudges some renters' decision.

## Scope

### In Scope
- Add 6 new inputs:
  - `tarifaRentaMarginal` (%, default 33) — used for both ETF tax and AFC refund
  - `tarifaGananciaViviendaPct` (%, default 10) — ganancia ocasional rate
  - `costoVentaViviendaPct` (%, default 5) — comisión inmobiliaria + legal
  - `viviendaPrimera` (boolean, default true) — applies the 7,500 UVT exemption
  - `aplicarImpuestos` (boolean, default true) — global on/off for the tax model
  - `aporteAfcMensual` (COP, default 0) — monthly AFC contribution; 0 = no AFC
- Track `aportadoTotalUsd` running through `simulate()` (cashInicial seed + monthly aportes + AFC refunds — needed for ETF tax basis)
- Add AFC refund mechanic: at each year-end in renter scenario, `etfUsd += (aporteAfcMensual × 12 × tarifaRentaMarginal/100) / tasa_m`
- Compute and expose new fields on `result`: `etfFinalUsdNeto`, `equityNeto`, `impuestos: { rentaEtf, gananciaVivienda, costosVenta, refundAfcTotalCop }`
- When `aplicarImpuestos=true`, the existing `result.diferencia` reflects equityNeto − etfFinalCopNeto. When false, current behavior preserved.
- New control-group "Impuestos y costos al cierre" in `index.html` with the 6 controls
- TDD discipline: write tests first (red), then implement (green), then UI

### Out of Scope
- Modelado completo del saldo AFC (this change only models the tax refund; the AFC balance itself is not tracked — user gets it back outside this comparison window)
- Retención sobre dividendos del ETF (CSPX is accumulating, not applicable)
- Impuesto al patrimonio
- 30%-of-income cap on AFC (user-responsibility input)
- Updating `README.md` / `docs/FORMULAS.md` (next change, like prior pattern)

## Capabilities

### New Capabilities
- `tax-and-exit-cost-model`: defines all tax math at simulation close-out and the AFC refund mechanic during the loop.

### Modified Capabilities
- None. The `etf-investment-mode` capability is unchanged; this layer extends the simulation post-loop and adds one mechanic (AFC refund) inside the loop.

## Approach

**TDD-first**: write `tests/tax-model.test.js` with all the new math scenarios FIRST (failing). Then implement in `calculator.js`. Then add UI in `index.html` + `ui.js`.

**Math, summarized**:
- Track `aportadoTotalUsd` from `cashInicial/tasaCopUsdInicial` (if toggle ON) + each month's USD contribution + each year-end AFC refund in USD.
- ETF tax: `impuestoEtf = max(0, (etfFinalUsd − aportadoTotalUsd) × tarifaRentaMarginal/100)`.
- Vivienda exemption: `7500 × UVT_BASE × (1 + ipcPct/100)^plazoAnios` if `viviendaPrimera`, else 0. UVT_BASE = `51000` (2026 estimate, hardcoded constant).
- Vivienda tax: `max(0, (utilidadVivienda − exencion) × tarifaGanancia/100)`.
- equityNeto: `max(0, valor − saldo − impuestoVivienda − costosVenta)`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | Track aportadoTotalUsd; AFC refund in loop; tax math at close; new fields in result |
| `js/ui.js` | Modified | Add 6 INPUT_CONFIG entries, readInputs fields, format helpers |
| `index.html` | Modified | New control-group "Impuestos y costos al cierre" with 6 controls |
| `tests/tax-model.test.js` | NEW | TDD tests written FIRST |
| `tests/calculator.test.js` | Modified | Update existing diferencia tests to account for default toggle ON |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing tests break because default `aplicarImpuestos=true` changes diferencia | High | Update existing tests to pass `aplicarImpuestos: false` for pre-tax assertions or assert against new fields |
| UVT/exención math wrong (subtle indexation) | Med | Explicit test scenarios with hand-computed expected values |
| AFC refund timing off-by-one (year-end vs year-start) | Med | Test with single-year scenarios; verify exact refund amount |
| User doesn't realize "Diferencia final" is now post-tax | Med | UI hint near the metric; recommendation text mentions taxes |

## Rollback Plan

Revert `js/calculator.js`, `js/ui.js`, `index.html`. Delete `tests/tax-model.test.js`. The change is additive — no existing data structure changes, so revert is clean.

## Dependencies

- `etf-investment-mode` capability spec is the foundation this layer extends.

## Success Criteria

- [ ] `tests/tax-model.test.js` written FIRST and FAILS before implementation (TDD red)
- [ ] After implementation, ALL 44 existing tests + new tax tests pass (green)
- [ ] With `aplicarImpuestos=false`, simulate output matches pre-change exactly (regression)
- [ ] With defaults + ON: ETF tax of ~33% applied to utility, vivienda exemption covers most utility for default $250M home → impuesto vivienda ≈ $0
- [ ] AFC scenario: aporteAfcMensual=$1M, tarifa=33% → annual refund $3.96M added to ETF; over 20 years adds ~$80M in COP-equivalent ETF growth
