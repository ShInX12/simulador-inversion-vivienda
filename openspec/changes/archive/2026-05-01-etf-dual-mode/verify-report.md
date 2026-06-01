# Verification Report — etf-dual-mode

**Change**: etf-dual-mode
**Mode**: Standard (Strict TDD disabled — no test runner; project deliberately zero-build)
**Date**: 2026-05-01
**Verification protocol**: manual (per `openspec/config.yaml` `rules.verify` and `sdd/Calculadora/testing-capabilities`)

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 24 |
| Tasks complete | 24 |
| Tasks incomplete | 0 |

All 6 phases checked off. Phase 6 marked complete after user confirmed "funciona bien" — manual smoke test passed.

---

## Build & Tests Execution

**Build**: ➖ N/A — project has no build step (vanilla HTML/CSS/JS deliberately, documented in README.md).
**Tests**: ➖ N/A — no test runner installed (zero-dependency design).
**Coverage**: ➖ Not available — no coverage tool.

These are NOT failures. The project's own `sdd-init` cache (`sdd/Calculadora/testing-capabilities`) marks all of these as expected-absent and prescribes manual verification as the substitute protocol.

---

## Spec Compliance Matrix

Status legend:
- ✅ STATIC — implementation evidence found in source code
- ✅ MANUAL — user confirmed behavior in browser smoke test
- ✅ STATIC+MANUAL — both
- ❌ FAILING / UNTESTED — gap

| Requirement | Scenario | Evidence | Status |
|-------------|----------|----------|--------|
| Investment Mode Selection | First load → "Aporte fijo" active | `index.html:38,39` (`data-mode="aporte-fijo"`, `is-active`) + user smoke | ✅ STATIC+MANUAL |
| Investment Mode Selection | Switching tabs recomputes + toggles inputs | `js/app.js:60-66` `bindModeTabs` + CSS `[data-mode-only]` rules + user smoke | ✅ STATIC+MANUAL |
| Diferencia Mode Behavior | costoCompra > costoArriendo → +diff | `js/calculator.js:151-153` `if (modo==='diferencia') { if (dif>0) etf += dif; }` + user smoke | ✅ STATIC+MANUAL |
| Diferencia Mode Behavior | costoArriendo > costoCompra → +0 | Same branch — `if (dif > 0)` guard | ✅ STATIC+MANUAL |
| Aporte Fijo Mode Behavior | First-year months → exact aporteMensual | `js/calculator.js:154-155` `else { etf += aporteActual; }` + user smoke | ✅ STATIC+MANUAL |
| Aporte Fijo Mode Behavior | Step-up at m=13 → ×(1+incr/100) | `js/calculator.js:142-145` `if (m > 1 && (m-1) % 12 === 0)` + user smoke | ✅ STATIC+MANUAL |
| Aporte Fijo Mode Behavior | Zero contribution → pure compounding | aporteActual=0 path returns etf*= 1+r unchanged + user smoke | ✅ STATIC+MANUAL |
| Initial Cash Investment Toggle | ON → ETF month-0 = cashInicial | `js/calculator.js:121` `let etf = invertirCashInicial ? cashInicial : 0` + user smoke | ✅ STATIC+MANUAL |
| Initial Cash Investment Toggle | OFF → ETF month-0 = 0 | Same line, false branch + user smoke | ✅ STATIC+MANUAL |
| Backward Compatibility (Regression) | Defaults under diferencia match pre-change | Diferencia branch is byte-equivalent to prior code path; user confirmed cuota $2.11M / cash $39M / cruce año 9 / dif +$152M | ✅ STATIC+MANUAL |

**Compliance summary**: 10/10 scenarios compliant via manual + static evidence.

Note: zero scenarios have automated test coverage. This is acceptable under the project's documented manual-verification protocol but is a structural risk — see WARNINGS below.

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Investment Mode Selection | ✅ Implemented | Tabs + data-mode mirroring + readInputs reads `modeTabs.dataset.mode` |
| Diferencia Mode Behavior | ✅ Implemented | Branch preserves byte-equivalent pre-change logic |
| Aporte Fijo Mode Behavior | ✅ Implemented | aporteActual + step-up at correct months + only in renter scenario |
| Initial Cash Investment Toggle | ✅ Implemented | Single gate on `etf` initialization, applies to both modes |
| Backward Compatibility | ✅ Implemented | Diferencia path identical; defaults in destructuring make `simulate({})` legacy-safe |

---

## Coherence (Design vs Implementation)

| Decision (from proposal) | Followed? | Notes |
|--------------------------|-----------|-------|
| `calculator.js`: branch in simulate() by mode | ✅ Yes | Branch at lines 151-156 |
| `calculator.js`: input contract extension with safe defaults | ✅ Yes | Defaults `'diferencia'`, `0`, `0`, `true` |
| `ui.js`: extend INPUT_CONFIG declaratively | ✅ Yes | aporte + incr added |
| `ui.js`: data-mode driven visibility | ✅ Yes | Mirror onto `.panel--controls` |
| `index.html`: tab strip + 2 sliders + 1 toggle | ✅ Yes | All present in expected sections |
| `app.js`: bind tabs + toggle to recalcular | ✅ Yes | bindModeTabs + bindToggle |
| `charts.js`: NOT MODIFIED (result shape unchanged) | ✅ Yes | File untouched, confirmed |
| `styles/main.css`: minimal tab + toggle styling | ✅ Yes | Section "5b. MODE TABS" added before sliders section |

No deviations detected.

---

## Issues Found

### CRITICAL (must fix before archive)
None.

### WARNING (should fix)
- **Zero automated test coverage for the new mode logic**. Currently only mitigated by the user's manual smoke test. Risk: future regressions in `simulate()` ETF math will not be caught automatically. Recommended (out of scope for this change): a future `/sdd-new add-vitest` change that adds Vitest + a small suite covering the 10 spec scenarios. The architecture is already test-friendly (`calculator.js` is pure).

### SUGGESTION (nice to have)
- **README.md / docs do not yet mention the new modes**. The Inputs table in `README.md` lists 10 inputs and does not include `aporteMensual`, `aporteIncrementoPct`, `invertirCashInicial`, or the mode selector. Updating these docs would close the loop on discoverability. Easy follow-up.
- **`docs/FORMULAS.md` §5 (Interés compuesto del ETF)** still describes "el aporte mensual es la diferencia entre el costo de comprar y el costo de arrendar" — only true for `diferencia` mode now. Worth a short addendum.
- **Verification automation gap**: even without a test runner, a tiny `<script type="module">` block that runs the 10 sanity asserts on page load and logs to console would give automated regression detection at zero infrastructure cost. Optional.

---

## Verdict

**PASS WITH SUGGESTIONS**

All 5 requirements implemented and validated against their scenarios via static code evidence and user-confirmed manual smoke test. Design adherence: 100% — no deviations. Critical regression invariant (mode='diferencia' + cashInicial=true matches pre-change baseline) confirmed. The change is ready for archive.

The only structural gap — zero automated test coverage — is a pre-existing project condition (deliberate zero-build design) and not introduced by this change. It is documented as a follow-up suggestion, not a blocker.
