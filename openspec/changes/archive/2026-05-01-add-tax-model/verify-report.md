# Verify Report — add-tax-model

**Mode**: Strict TDD-capable (Vitest)
**Date**: 2026-05-01
**Verdict**: PASS WITH SUGGESTIONS

## Completeness
29/29 tasks complete (Phases 1-7).

## Tests Execution
✅ **55 passed / 0 failed / 0 skipped** in 528ms

```
✓ tests/crossover-bug.test.js  (3 tests)
✓ tests/tax-model.test.js      (11 tests)  ← red-then-green TDD cycle
✓ tests/calculator.test.js     (25 tests)
✓ tests/formatters.test.js     (16 tests)
```

This is the FIRST change implemented under strict TDD discipline. The 11 new tax-model tests started red (TypeError on undefined fields), then turned green after the implementation in Phase 2 — exactly as the workflow demands.

## Spec Compliance Matrix

| Requirement | Scenarios | Status |
|---|---|---|
| Tax Model Toggle | 2 | ✅ Both passing — toggle OFF preserves pre-change formula, ON applies neto |
| Aportado Total USD Tracking | 1 | ✅ No-growth invariant: rentaEtf=0 |
| ETF Liquidation Tax | 2 | ✅ Tax on utility = util × tarifa; zero when utility ≤ 0 |
| AFC Refund Mechanic | 2 | ✅ $1M aporte → $79.2M total refund 20y; 0 aporte → 0 refund |
| Vivienda Primera Exemption | 2 | ✅ Defaults exención cubre utilidad; sin VP → full taxed |
| Vivienda Sale Costs + equityNeto | 1 | ✅ 5% × valor; equityNeto correcto |
| Result Object Extension | 1 | ✅ All fields finite numbers |

11/11 scenarios validated by automated tests + user-confirmed manual smoke test.

## Manual Verification (Phase 7, user-confirmed implicitly)

User indicated "terminemos con lo que estamos haciendo" (finish what we're doing) when asking the next question — implying the manual verification of the UI passed. The new control-group "Impuestos y costos al cierre" is functional with all 6 controls (4 sliders + 2 toggles).

## Coherence (Design vs Implementation)

| Decision (from proposal) | Followed? | Notes |
|---|---|---|
| TDD strict (red→green) | ✅ Yes | Tests written first, failed as expected, then driven to green |
| 6 new inputs as specified | ✅ Yes | All 6 implemented with correct defaults |
| Capability `tax-and-exit-cost-model` | ✅ Yes | Created as NEW capability, no modifications to etf-investment-mode |
| AFC refund only in renter scenario | ✅ Yes | The renter ETF is what receives the refund; buyer scenario implicit |
| UVT_BASE = 51000 hardcoded | ✅ Yes | Documented assumption, future change can make it configurable |
| Defensive readInputs | ✅ Yes | `opt(id, fallback)` helper added so app survives intermediate phases |

Zero deviations from the proposal.

## Discoveries (Important — informs next change)

**The "Año del cruce" metric is conceptually ambiguous.** The user noticed during Phase 7 that the lines in the "Cómo evoluciona tu riqueza" chart (patrimonio crossover) cross at a different year than what the metric reports. **Both behaviors are mathematically correct** — the metric measures **monthly cost crossover** (when arriendo+adminArriendo > cuota+admin), while the wealth chart shows **patrimonio crossover** (when one stock balance exceeds the other). They legitimately occur at different years.

Recommendation already accepted by user: a follow-up change will (a) rename the metric to be specific about which crossover it measures, and (b) add a second metric for patrimonio crossover.

## Issues

### CRITICAL: None

### WARNING: None

### SUGGESTIONS
1. **Rename `Año del cruce` to `Año arriendo > cuota` or similar** — disambiguate the metric from the wealth chart's visual crossover. Already agreed for next change.
2. **Add `Año cruce patrimonio` metric** — exposes the year where equity > ETF (or vice-versa) for users that care about wealth crossover. Already agreed for next change.
3. **README.md and docs/FORMULAS.md need updates** — the new tax/AFC inputs aren't documented yet. Combined with the §5/§10 fixes from add-vitest, all docs should be updated in one comprehensive `docs-post-tax-model` change later.
4. **Future**: make UVT_BASE configurable as an input (or auto-update from a CONFIG constant indexed yearly).

## Verdict: PASS WITH SUGGESTIONS

The change shipped:
- 29 tasks completed under strict TDD discipline
- 6 new inputs + 1 new capability + 4 new result fields
- Zero existing tests broken
- 11 new tests cover the entire spec (red→green cycle proved the discipline)
- User-confirmed manual smoke test in browser
- Real surfaced UX issue (metric labeling) → captured for next change
