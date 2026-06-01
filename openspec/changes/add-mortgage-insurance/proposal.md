# Proposal: Mortgage insurance

## Intent

Validating against the FNA calculator showed our amortization is exact, but we're missing the mandatory mortgage insurance (vida deudor + incendio, which the FNA bundles). For the FNA case (vivienda $250M, monto $200M, 9.5% EA, 20y), the insurance is $190,784/mo = 0.0954% of the balance. Add it as a monthly rate on the outstanding balance — it decreases over time as the balance amortizes, scales with the financed amount, and reproduces the FNA figure.

## Scope

### In Scope
- New input `seguroHipotecaPct` (monthly insurance rate, % of outstanding balance). Default 0.095, range 0–0.25, step 0.005.
- In `simulate()`: each month `seguroM = saldo × seguroHipotecaPct/100`; add it to `costoCompra` and to `gastoCompraSunkAcum`.
- Expose `result.seguroMensualInicial = monto × seguroHipotecaPct/100` (first-month insurance; for the output label and tests).
- Insurance flows into: `costoCompraMes`, `cargaCompraPct`, `gastoCompraSunkAcum`, and (in `diferencia` mode) the renter's ETF contribution. In `aporte-fijo` it affects cash-flow charts but not the final patrimonio (same as tasa/arriendo).
- UI: slider in the "Hipoteca" section; output shows rate + equivalent amount ("0.095% · ~$190k/mes").
- TDD strict.

### Out of Scope
- Separate vida/incendio components (option c).
- Changing the scorecard "Mensual inicial" to include insurance (possible later iteration; for now it stays the pure cuota).
- Presets setting the insurance rate.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — extends the cost model. Tests carry the insurance math.

## Approach

### Calc (in `simulate()`)
```js
// destructure: seguroHipotecaPct = 0.095
// inside loop, with `saldo` = balance at start of month (pre-amortization of this month):
const seguroM = saldo * seguroHipotecaPct / 100;
const costoCompra = cuota + admin + seguroM;   // was cuota + admin
// ...
gastoCompraSunkAcum += interesM + admin + seguroM;  // insurance is sunk too
// after loop:
const seguroMensualInicial = monto * seguroHipotecaPct / 100;
```
`costoCompraMes` in yearly snapshots becomes `cuota + admin + seguroM` (admin post-bump, seguro on that month's balance). yearly[0] uses `monto × rate` for the seguro component.

Insurance is sunk (not recovered), so it joins `gastoCompraSunkAcum` alongside intereses + admin.

### UI
- `INPUT_CONFIG.seguro`: format the rate. Output via a post-loop helper showing `rate% · ~$Xk/mes` where X = (precio − cuotaInicial) × rate/100.
- `readInputs`: `seguroHipotecaPct: opt('seguro', 0.095)`.
- Slider `seguro` in the Hipoteca control-group.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | seguroHipotecaPct input + seguroM in loop + costoCompra/sunk/snapshot + result.seguroMensualInicial + JSDoc |
| `js/ui.js` | Modified | INPUT_CONFIG seguro + readInputs + output helper |
| `index.html` | Modified | Slider in Hipoteca section |
| `tests/insurance.test.js` | NEW | TDD (reproduces FNA) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Off-by-one: seguro on pre- vs post-amortization balance | Med | Use balance at month start (matches FNA mes-1 = monto × rate); test asserts seguroMensualInicial = monto × rate |
| Insurance not flowing into all the right places (sunk, carga, cost) | Med | Tests check sunk increases; manual verify the cost chart |
| Default 0.095 not matching every lender | Low | It's adjustable; 0.095 reproduces FNA closely ($190k vs $190,784) |

## Rollback Plan

Revert the 3 files, delete the test. Additive (new input defaults to 0.095; setting it to 0 disables insurance).

## Success Criteria

- [ ] `tests/insurance.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: all tests pass.
- [ ] FNA reproduction: with monto $200M and rate 0.095%, `result.seguroMensualInicial ≈ $190,000`.
- [ ] Insurance > 0 increases `gastoCompraSunkAcum` vs rate 0.
- [ ] Insurance decreases over time (cost chart's buy line reflects it; with admin=0/ipc=0, costoCompraMes year1 > year20).
- [ ] Browser: slider in Hipoteca; output shows rate + equivalent amount; "Comprar vs arrendar" cost line rises by the insurance.
- [ ] No console errors.
