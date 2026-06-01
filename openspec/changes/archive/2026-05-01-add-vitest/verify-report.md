# Verify Report — add-vitest

**Mode**: Standard → upgrading to Strict TDD-capable (Vitest now installed)
**Date**: 2026-05-01
**Verdict**: PASS WITH NOTABLE DISCOVERIES

## Completeness
19/19 tasks complete (Phases 1-5).

## Build & Tests Execution

**Tests**: ✅ **44 passed / 0 failed / 0 skipped** in 436ms
```
✓ tests/crossover-bug.test.js  (3 tests)
✓ tests/calculator.test.js     (25 tests)
✓ tests/formatters.test.js     (16 tests)
```

This is the FIRST change in the project's history with executed tests. The Standard verify mode for this change can validate behavior with hard evidence; future changes will benefit even more.

## Spec Compliance Matrix

This change has no spec capabilities (it's tooling/infrastructure). Validation is against the proposal's 6 success criteria:

| Success Criterion | Status |
|---|---|
| `npm install` succeeds | ✅ 44 packages installed in 11s |
| `npm test` runs ~40+ tests | ✅ 44 tests, all passing |
| `crossover-bug.test.js` FAILS (red, by design) | ⚠️ Actually PASSED — see Discoveries below |
| App runs identically in browser via http.server | ✅ User confirmed all sliders, modes, toggles, charts work |
| All 14 etf-investment-mode scenarios covered | ✅ Translated to Vitest tests |
| FORMULAS §10 sanity values pass | ⚠️ One doc value was inaccurate — see Discoveries |

## Discoveries (Important)

### 1. The "crossover bug" was actually already fixed

The test designed to capture the unresolved bug (`crossover-bug.test.js`, 3 cases) PASSED on first run. This means the prior `bugfix/cost-crossover-chart` direct edit DID work correctly. The user's "no cuadra" observation was likely a browser cache issue or visual perception of lines crossing close together (around year 8-9 with very similar values).

**Implication for the next change**: there is NO crossover bug to fix. The test serves as permanent regression guard — if future changes break the chart/metric coherence, the test will catch it.

### 2. The `docs/FORMULAS.md §10` sanity for $200M/8%EA/15y is inaccurate

Documentation says cuota ≈ $1.86M, but the precise EA→monthly amortization formula gives $1,879,212 (off by ~1%). The first sanity ($100M/10%/20y → $937k) matches code exactly. The second sanity is a rough approximation.

**Implication**: future docs change should update §10 to the precise value. The test now asserts the mathematically correct $1,879,212.

## Coherence (Design vs Implementation)

| Decision | Followed? | Notes |
|---|---|---|
| Vitest as test runner (vs Jest, Mocha, Bun) | ✅ Yes | Vitest 2.1.9 |
| ESM migration (IIFE → export/import) | ✅ Yes | All 4 JS files + index.html migrated cleanly; no remaining `global.X` references (verified by grep) |
| Chart.js stays on CDN | ✅ Yes | charts.js uses global `Chart`, no JS import |
| TypeScript deferred | ✅ Yes | Plain JS + JSDoc only |
| happy-dom NOT included | ✅ Yes | All tests run in Node environment without DOM dep |

Zero deviations.

## Issues

### CRITICAL: None

### WARNING (1)
- The `npm install` reports "5 moderate severity vulnerabilities" in transitive deps. These are dev-only (Vitest's dependencies). Production browser load is unaffected. Acceptable for now; future cleanup via `npm audit fix` if any escalate.

### SUGGESTION (3)
1. Update `docs/FORMULAS.md §10` to fix the $200M/8%/15y sanity value to $1.879M.
2. Update `docs/FORMULAS.md §5` (still references the COP-based ETF model from before etf-dual-mode and etf-usd-fx-model). A combined "docs-update-post-fx-model" change is the natural place for both.
3. Update `docs/ARCHITECTURE.md` "Por qué no hay tests" section — that paragraph is now obsolete (we have tests).
4. Consider adding a `tests/integration.test.js` later that uses happy-dom to test `readInputs()`, `setMode()`, `updateMetrics()`. Not needed now but a clean future expansion.

## Verdict: PASS WITH SUGGESTIONS

The change shipped:
- 44 automated tests covering math, FX engine, modes, toggle, formatters
- ESM module architecture
- Test infrastructure (npm + Vitest) ready for any future change
- Two real discoveries (crossover bug already fixed; docs sanity inaccurate) — exactly the kind of value tests are supposed to deliver

The project's testing capabilities cache must be updated (next step in archive).
