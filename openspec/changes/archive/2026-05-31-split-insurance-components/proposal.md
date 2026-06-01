# Proposal: Split insurance into two components

## Intent

The mortgage insurance is currently a single rate on the outstanding balance (decreasing). But real bank payment plans separate two components that behave differently: **vida deudor** decreases with the balance, while **incendio** is a fixed charge on the property value. Modeling them as one decreasing rate doesn't match those plans in later years. Split into two configurable components so the user can match their bank.

## Scope

### In Scope
- Replace `seguroHipotecaPct` with two inputs:
  - `seguroVidaPct` — monthly % of the **outstanding balance** (decreasing). Default 0.05, range 0–0.2, step 0.005.
  - `seguroIncendioPct` — monthly % of the **initial property value** (fixed). Default 0.045, range 0–0.2, step 0.005.
- In `simulate()`: `seguroVidaM = saldo × seguroVidaPct/100` (decreases), `seguroIncendioM = precio × seguroIncendioPct/100` (constant). `seguroM = vida + incendio`, flowing into costoCompra, costoCompraMes, cargaCompraPct, gastoCompraSunkAcum.
- `result.seguroMensualInicial = monto × seguroVidaPct/100 + precio × seguroIncendioPct/100`.
- UI: two sliders (replace the single one) in the Hipoteca section; each output shows rate + equivalent amount.
- Migrate tests that pinned `seguroHipotecaPct: 0` to the new field names.
- TDD strict.

### Out of Scope
- Incendio that grows with appreciation (option b) — we use fixed-on-initial-value (a).
- "Plan de pagos" (full month-by-month amortization table) — future feature to validate against the bank.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — refines the cost model; tests carry the math.

## Approach

### Calc (in `simulate()`)
```js
// destructure: seguroVidaPct = 0.05, seguroIncendioPct = 0.045  (replaces seguroHipotecaPct)
const seguroIncendioM = precio * seguroIncendioPct / 100;  // constant (initial value)
// inside loop:
const seguroVidaM = saldo * seguroVidaPct / 100;           // decreases with balance
const seguroM = seguroVidaM + seguroIncendioM;
const costoCompra = cuota + admin + seguroM;
// ...
gastoCompraSunkAcum += interesM + admin + seguroM;
// after loop:
const seguroMensualInicial = monto * seguroVidaPct / 100 + precio * seguroIncendioPct / 100;
```
yearly snapshots and yearly[0] include `seguroM` (vida on that month's balance + fixed incendio) in costoCompraMes and cargaCompraPct.

### UI
- INPUT_CONFIG: `seguroVida`, `seguroIncendio` (format `toFixed(3) + '%'`).
- readInputs: `seguroVidaPct: opt('seguroVida', 0.05)`, `seguroIncendioPct: opt('seguroIncendio', 0.045)`.
- refreshOutputs: vida output = rate + `~$X/mes` over balance (monto); incendio output = rate + `~$X/mes` over precio.
- index.html: two sliders replacing the single `seguro` slider in Hipoteca.

### Migration
- `tests/admin-split.test.js` and `tests/calculator.test.js` pinned `seguroHipotecaPct: 0` → change to `seguroVidaPct: 0, seguroIncendioPct: 0`.
- `tests/insurance.test.js` rewritten for two components.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | Two insurance inputs; vida decreases, incendio fixed; result field |
| `js/ui.js` | Modified | Two INPUT_CONFIG entries + readInputs + two output helpers |
| `index.html` | Modified | Two sliders replace the single one |
| `tests/insurance.test.js` | Rewritten | Two-component tests |
| `tests/admin-split.test.js`, `tests/calculator.test.js` | Modified | Pin new field names to 0 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migration misses a `seguroHipotecaPct` reference | Med | grep after the change; tests catch undefined behavior |
| Incendio base wrong (precio vs valor apreciado) | Low | Spec says fixed on initial precio; test asserts year1 === year20 with vida=0 |
| Vida/incendio behavior swapped | Low | Tests: vida decreases (year1>year20), incendio constant (year1===year20) |

## Rollback Plan

Revert the files, restore the single `seguroHipotecaPct`. Additive-equivalent (two fields default to sensible values).

## Success Criteria

- [ ] `tests/insurance.test.js` rewritten first, FAILS before implementation (RED).
- [ ] Post-implementation: all tests pass.
- [ ] `seguroMensualInicial = monto × seguroVidaPct/100 + precio × seguroIncendioPct/100` (e.g. 200M×0.05% + 250M×0.045% = $212,500).
- [ ] Vida decreases: with vida>0, incendio=0, admin=0, ipc=0 → costoCompraMes year1 > year20.
- [ ] Incendio fixed: with vida=0, incendio>0, admin=0, ipc=0 → costoCompraMes year1 === year20.
- [ ] Browser: two sliders in Hipoteca; each shows rate + amount; cost chart reflects both.
- [ ] No leftover `seguroHipotecaPct` references; no console errors.
