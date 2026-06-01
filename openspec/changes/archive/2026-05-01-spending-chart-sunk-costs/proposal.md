# Proposal: Spending chart — sunk costs only

## Intent

The spending chart added in `add-spending-chart` plotted **total** accumulated spending for the buyer (cuotaInicial + capital + intereses + admin + escrituración). The user correctly identified that this is misleading: cuotaInicial and the capital portion of each cuota are NOT spent — they go to equity and the buyer recovers them when selling. The renter's accumulated spending is 100% sunk (gone forever). Comparing total-spending vs sunk-spending is apples-to-pears.

Replace the buyer's line with **sunk costs only** (intereses + admin + escrituración) so the chart compares "money you don't get back" on both sides. Rename the chart to reflect the new semantics.

## Scope

### In Scope
- Replace `yearly[].gastoCompraAcum` with `yearly[].gastoCompraSunkAcum`. Components: escrituración (one-time, day 0) + sum of (intereses_m + admin_m) over months.
- Update the spending crossover detection to use the new field. The semantics shift: now it's "year where renter's sunk costs exceed buyer's sunk costs" — a more meaningful question.
- Rename `result.spendingCrossoverYear` semantics (variable name unchanged, but documents the new meaning in JSDoc).
- Update `tests/spending.test.js`: assertions match the new semantics. Specifically, `yearly[0].gastoCompraSunkAcum === escrituracion` (not `cashInicial`).
- Update `js/charts.js` dataset label: "Comprar acumulado" → "Comprar (intereses + admin + escrituración)".
- Update `index.html`: chart title, eyebrow, legend, aria-label.

### Out of Scope
- Keeping the old `gastoCompraAcum` (total spending) field as legacy — replaced cleanly.
- Toggle between "total" and "sunk" views — single sunk view only (correct framing).
- Updating README/FORMULAS for the chart (defer to a docs follow-up).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — semantic refinement of an internal field. Tests carry the new contract.

## Approach

### Math change in `simulate()`
Replace:
```js
let gastoCompraAcum = cashInicial;
// ... inside loop, pre-bump:
gastoCompraAcum += costoCompra;
```

With:
```js
let gastoCompraSunkAcum = escrituracion; // upfront sunk = escrituración (NOT cuotaInicial, that's equity)
// ... inside loop, AFTER amortización (so interesM is computed), still pre-bump for admin:
gastoCompraSunkAcum += interesM + admin;
```

### Naming changes
- Field: `gastoCompraAcum` → `gastoCompraSunkAcum`
- Chart title: "Cuánto has pagado en cada escenario" → "Plata perdida en cada escenario"
- Eyebrow: "Gasto acumulado" → "Gasto no recuperable"
- Dataset labels:
  - "Comprar acumulado (cuota inicial + cuotas + admin)" → "Comprar (intereses + admin + escrituración)"
  - "Arrendar acumulado (arriendo + admin parcial)" → unchanged ("Arrendar (arriendo + admin parcial)")
- Legend swatches in HTML: same updates as dataset labels
- Aria label: "Plata perdida en compra vs arriendo a lo largo del tiempo"

### TDD
Tests updated FIRST to assert the new semantics (RED), then implementation drives them GREEN.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | Rename field; change accumulation formula; update JSDoc |
| `js/charts.js` | Modified | Rename dataset label; reference new field |
| `index.html` | Modified | Rename title, eyebrow, legend, aria |
| `tests/spending.test.js` | Modified | Update assertions for new semantics |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Forgetting to rename in one of the 4 files leaves a broken reference | Low | Tests would catch it (`gastoCompraAcum` referenced anywhere → undefined → test fails) |
| User expects to also see total spending somewhere | Med | If wanted, future change adds a toggle (out of scope here per user's decision) |
| Spending crossover year shifts later (unsurprising) and confuses users used to the previous chart | Low | Title rename + legend rename make the new semantics clear |

## Rollback Plan

Revert the 4 files. Additive-equivalent change (rename, no new fields beyond what we had).

## Success Criteria

- [ ] `tests/spending.test.js` updated and FAILS before implementation (TDD red).
- [ ] After implementation: 62 tests passing.
- [ ] With defaults: `yearly[0].gastoCompraSunkAcum ≈ $13,750,000` (= 5.5% × $250M escrituración).
- [ ] `yearly[20].gastoCompraSunkAcum < yearly[20].gastoCompraAcum-old` (sunk is less than total — sanity check that the change worked).
- [ ] Browser: chart title reads "Plata perdida en cada escenario"; legend reflects new dataset names; lines render correctly with the dashed marker at the (potentially shifted) crossover year.
