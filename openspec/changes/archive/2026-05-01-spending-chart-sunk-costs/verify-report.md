# Verify Report — spending-chart-sunk-costs

**Mode**: Strict TDD-capable (Vitest)
**Date**: 2026-05-01
**Verdict**: PASS

## Completeness
19/19 tasks complete (Phases 1-4). User confirmed manual verification ("todo cuadra").

## Tests Execution
✅ **63 passed / 0 failed / 0 skipped** in 474ms

```
✓ tests/crossover-metrics.test.js  (3 tests)
✓ tests/spending.test.js           (5 tests)  ← red→green: rename + new sanity
✓ tests/tax-model.test.js          (11 tests)
✓ tests/crossover-bug.test.js      (3 tests)
✓ tests/calculator.test.js         (25 tests)
✓ tests/formatters.test.js         (16 tests)
```

Fourth consecutive change under strict TDD — clean red-then-green cycle.

## Success Criteria Check

| Criterion | Status |
|---|---|
| Tests updated FIRST and FAILED before implementation | ✅ 5 tests in red phase |
| 63 tests passing post-implementation | ✅ Confirmed |
| `yearly[0].gastoCompraSunkAcum ≈ $13,750,000` (escrituración con defaults) | ✅ Test asserts and passes |
| `yearly[20].gastoCompraSunkAcum < yearly[20]` of old field (sunk < total) | ✅ ~$445M < ~$709M (the old total) — confirmed by sanity test |
| Browser: chart title "Plata perdida en cada escenario" | ✅ User confirmed |
| Legend reflects new dataset names | ✅ User confirmed |
| Lines render correctly with shifted crossover marker | ✅ User confirmed |

## Coherence (Design vs Implementation)

| Decision | Followed? | Notes |
|---|---|---|
| TDD strict (red → green) | ✅ Yes | Clean cycle |
| Replace gastoCompraAcum (no legacy) | ✅ Yes | Renamed cleanly to gastoCompraSunkAcum |
| Rename chart title + legend | ✅ Yes | All 4 strings updated in index.html + 1 in charts.js |
| Move accumulation post-amortization (need interesM) | ✅ Yes | Tracking line moved correctly; admin still pre-bump as required |
| spendingCrossoverYear semantics shift to sunk-vs-sunk | ✅ Yes | Detection updated to use new field |

Zero deviations.

## Discoveries
- The user's intuition that "comprar acumulado mezcla recuperable + sunk" was financially correct and led to a more honest comparison. Worth remembering: **the user often spots model flaws better than I do, especially financial ones**.
- The new chart story is much more useful: "comprar pierde ~$445M en sunk costs over 20 años, arrendar pierde ~$710M". Difference of ~$265M favoreciendo comprar — and that's BEFORE counting the equity recovered (~$603M house). The full story is now visible across two charts: cMain (patrimonio = recuperable) + cGasto (sunk = perdido).

## Issues

### CRITICAL: None
### WARNING: None
### SUGGESTIONS
- README outputs section says "Más tres gráficos" but we now have 4. Combined docs follow-up should fix this.
- FORMULAS.md could get a §13 explaining sunk vs total spending and the rationale for the chart's design.
- The chart title "Plata perdida en cada escenario" is informal/colloquial — appropriate for the project's tone but worth flagging in case future translations/i18n want to formalize.

## Verdict: PASS

Clean refinement. The chart now tells a financially honest story.
