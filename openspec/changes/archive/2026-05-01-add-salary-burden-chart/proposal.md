# Proposal: Add salary-burden chart

## Intent

The mortgage cuota is nominal and fixed for 20 years, but the user's salary (presumably) grows. So a cuota that's 50% of income today might be 20% in year 15. The model doesn't capture this — it's the classic argument for buying ("la cuota es fija, tu sueldo sube"). Add a salary input + growth rate, and a chart showing the monthly cost burden (total cost / salary, %) over time for both buying and renting.

This is a visualization-only feature: it does NOT change "Diferencia final" or any wealth/spending calculation. It adds an effort/affordability lens.

## Scope

### In Scope
- Two new inputs: `salarioMensual` (COP, default $5M) and `crecimientoSalarialPct` (%, default 5).
- Track salary month-by-month with its own compounded monthly growth (mirrors how arriendo/admin grow).
- Add `cargaCompraPct` and `cargaArriendoPct` to each `yearly[]` snapshot: total monthly cost / salary × 100, using the same post-IPC-bump values as `costoCompraMes`/`costoArriendoMes` so they're temporally consistent.
- New line chart `cCarga` in `charts.js`: two datasets (carga comprar, carga arrendar), Y-axis in %.
- New `<figure>` in `index.html` with canvas `cCarga` + the two new sliders.
- TDD strict: tests written FIRST.

### Out of Scope
- Affecting "Diferencia final" or any wealth/spending math (purely a burden lens).
- Salary affecting ETF contributions (those have their own `aporteIncrementoPct`).
- README/FORMULAS updates (defer to docs follow-up).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — observable extension. Tests carry the contract.

## Approach

### Math (in `simulate()`)
```js
const salMensual = eaToMonthly(crecimientoSalarialPct);
let salario = salarioMensual;

// In the loop, alongside the IPC bumps (line ~221):
salario *= 1 + salMensual;

// In the snapshot (uses post-bump cuota+admin / arriendo+adminArriendo, same as costoCompraMes):
cargaCompraPct:   ((cuota + admin) / salario) * 100,
cargaArriendoPct: ((arriendo + adminArriendo) / salario) * 100,

// yearly[0]: uses initial values
cargaCompraPct:   ((cuota + adminInicial) / salarioMensual) * 100,
cargaArriendoPct: ((arriendoInicial + adminInicial * 0.5) / salarioMensual) * 100,
```

Key invariant: when `crecimientoSalarialPct === ipcPct`, the renter burden stays constant (numerator and denominator grow at the same rate), and the buyer burden decreases (cuota is fixed while salary grows).

### Chart
New `cCarga` line chart, 2 datasets, Y-axis ticks `v + '%'`. Tooltip shows `'X.X% del salario'`.

### UI
Two sliders in a new control-group "Tu salario" (or appended to an existing group). Chart figure after `cAporte`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | 2 inputs + salary tracking + 2 yearly fields + JSDoc |
| `js/ui.js` | Modified | 2 INPUT_CONFIG entries + readInputs |
| `index.html` | Modified | 2 sliders + new figure cCarga |
| `js/charts.js` | Modified | cCarga chart init + updateAll |
| `tests/salary-burden.test.js` | NEW | TDD-first |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Salary timing inconsistent with cost timing (pre vs post IPC bump) | Med | Bump salary alongside arriendo/admin; snapshot reads both post-bump. Test asserts year-0 exact + the equal-growth invariant |
| New inputs break readInputs if DOM not ready | Low | Defensive `opt()` helper already exists in readInputs; use it |
| 6 charts feels like a lot | Low | Each answers a distinct question; user explicitly requested this one |

## Rollback Plan

Revert the 4 files, delete `tests/salary-burden.test.js`. Additive.

## Success Criteria

- [ ] `tests/salary-burden.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: 67 + N tests passing.
- [ ] yearly[0].cargaCompraPct === (cuota + adminInicial) / salarioMensual × 100 (≈49.7% with defaults).
- [ ] yearly[0].cargaArriendoPct === (arriendoInicial + adminInicial×0.5) / salarioMensual × 100 (≈35.8% with defaults).
- [ ] Invariant: with crecimientoSalarialPct === ipcPct, cargaArriendoPct is ~constant across all years.
- [ ] Invariant: with salary growing, cargaCompraPct DECREASES over time (cuota fixed).
- [ ] Browser: chart shows buyer burden declining, renter burden ~flat (default), both as % of salary.
