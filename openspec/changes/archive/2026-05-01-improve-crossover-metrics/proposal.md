# Proposal: Improve crossover metrics (rename + new patrimonio metric)

## Intent

During manual verification of `add-tax-model`, the user noticed that the "Año del cruce" metric reports a different year than where the lines cross visually in the "Cómo evoluciona tu riqueza" chart. The discrepancy is mathematically correct — the metric measures **monthly cost crossover** (`costoArriendo > costoCompra`), while the wealth chart shows **patrimonio crossover** (`equity` vs `etf` stock balance) — but the metric label is ambiguous.

Two-part fix: (1) rename the existing metric to disambiguate it, (2) add a new metric for the patrimonio crossover so users have both views.

## Scope

### In Scope
- Rename existing metric label from `"Año del cruce"` to `"Año arriendo > cuota"` (cost crossover, the existing field `result.crossover` is unchanged — only the label).
- Add new field `result.crossoverPatrimonio` computed post-loop: first year (a > 0) where the sign of `(yearly[a].equity - yearly[a].etf)` differs from the prior year's sign. Null if never crosses or always one-sided.
- Add new metric card `"Cruce de patrimonio"` in `index.html` with id `m-cruce-pat`.
- Update `updateMetrics()` in `ui.js` to render the new card.
- TDD strict: write tests first, then implement. 2-3 new tests covering the patrimonio-crossover detection with known scenarios.

### Out of Scope
- Visual marker on the cMain chart for the patrimonio crossover (could be later UI polish).
- Tooltip / help text expansion (could be later).
- Updates to `README.md` / `docs/FORMULAS.md` (deferred to combined docs change).
- Changing the existing `result.crossover` field name (would break test contracts; only the UI label changes).

## Capabilities

### New Capabilities
None — this is a derived metric + UI label change. Tests carry the contract.

### Modified Capabilities
None — `result.crossover` semantics unchanged; this change adds a sibling field `crossoverPatrimonio`.

## Approach

### Patrimonio crossover detection (post-loop, in calculator.js)
```js
let crossoverPatrimonio = null;
for (let i = 1; i < yearly.length; i++) {
  const prevSign = Math.sign(yearly[i-1].equity - yearly[i-1].etf);
  const currSign = Math.sign(yearly[i].equity - yearly[i].etf);
  if (prevSign !== currSign && prevSign !== 0 && currSign !== 0) {
    crossoverPatrimonio = yearly[i].anio;
    break;
  }
}
```

Add `crossoverPatrimonio` to the returned result object.

### UI changes
- `index.html`: change the metric card label from "Año del cruce" to "Año arriendo > cuota". Insert new card "Cruce de patrimonio" with `id="m-cruce-pat"`.
- `js/ui.js`: in `updateMetrics()`, render the new card with `result.crossoverPatrimonio ? 'Año ' + result.crossoverPatrimonio : 'Nunca'`.

### Tests (TDD-first)
1. Default scenario → `crossoverPatrimonio` is a number between 1 and 20 (some year)
2. Edge case: with `aplicarImpuestos=false` and inputs that make compra always lead → `crossoverPatrimonio === null`
3. Edge case: signs flip multiple times → metric reports only the FIRST flip

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | Add post-loop crossoverPatrimonio detection + return field |
| `js/ui.js` | Modified | `updateMetrics()` renders new card |
| `index.html` | Modified | Rename existing label + new metric card |
| `tests/crossover-metrics.test.js` | NEW | TDD tests for the new field |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Metrics row layout breaks (now 7 cards instead of 6) | Low | Existing `metrics` grid uses `auto-fit minmax(140px, 1fr)` — handles N cards gracefully. Visual smoke test confirms. |
| Existing tests break due to renamed label | None | We're not changing `result.crossover` field name; only HTML label text. Tests assert against fields, not labels. |
| Edge case where signs are zero (equity == etf exactly) | Low | The detection requires both signs to be ±1 (excluded with `!== 0` checks) |

## Rollback Plan

Revert `js/calculator.js`, `js/ui.js`, `index.html`. Delete `tests/crossover-metrics.test.js`. Tiny additive change.

## Dependencies

- None. Uses existing `yearly[]` data already in result.

## Success Criteria

- [ ] `tests/crossover-metrics.test.js` written first, FAILS before implementation (TDD red).
- [ ] After implementation: 55 + 3 = 58 tests passing.
- [ ] Browser: existing metric labeled "Año arriendo > cuota"; new metric "Cruce de patrimonio" appears with correct value.
- [ ] With defaults, `crossoverPatrimonio` is a finite number between 1-20 (the lines DO cross).
- [ ] With heavy compra-favored inputs (e.g., 0% ETF return), `crossoverPatrimonio` could be null OR very early — tests cover this.
