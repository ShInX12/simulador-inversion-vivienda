# Proposal: Goal-seek (puntos de quiebre)

## Intent

The calculator answers "who wins?" but not "how robust is that answer?". Goal-seek inverts the question: for each key lever, find the break-even value where the verdict flips. It tells the user *"buying wins — and the ETF would have to return 14% (vs your 8%) for renting to beat it"*. That reframes a single number into a sensitivity insight almost no calculator offers.

## Scope

### In Scope
- `Calculator.goalSeek(input, key, min, max)` — bisection over `simulate({...input,[key]:v}).diferencia` to find where it crosses 0. Returns the threshold, or `null` if no crossing exists within the range.
- `Calculator.breakevens(input)` — runs goalSeek for the 4 levers (retornoEtfUsdPct [0–18], apreciacionPct [0–10], tasaEA [4–18], arriendoInicial [0.5M–6M]); returns `[{ key, umbral|null, actual }]`.
- `recalcular()` orchestrates: calls `breakevens(inputs)` and passes to `UI.updateGoalSeek`.
- `UI.updateGoalSeek(input, breakevens)` — renders a text section "¿Qué cambiaría el resultado?": one line per lever with `≥`/`≤` threshold vs current; "ni en el rango cambia" when null.
- New HTML section + CSS.
- TDD strict.

### Out of Scope
- Non-monotonic levers (only the 4 monotonic ones).
- An interactive goal-seek slider (text only).
- Devaluación and other levers.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — pure derived analysis + UI. Tests carry the math contract.

## Approach

### Bisection (in `calculator.js`)
```js
function goalSeek(input, key, min, max) {
  const difAt = (v) => simulate({ ...input, [key]: v }).diferencia;
  let lo = min, hi = max;
  const dLo = difAt(lo), dHi = difAt(hi);
  if (Math.sign(dLo) === Math.sign(dHi) || dLo === 0 || dHi === 0) {
    // no sign change in range → no break-even (or edge exactly 0)
    if (dLo === 0) return lo; if (dHi === 0) return hi;
    return null;
  }
  for (let i = 0; i < 50 && (hi - lo) > 1e-6; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(difAt(mid)) === Math.sign(dLo)) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
```
`breakevens(input)` maps over `BREAKEVEN_VARS` (key + min + max constants — financial-domain ranges, DOM-free, fine in calculator.js).

Runs ~4 levers × ~24 bisection steps ≈ 100 simulate() calls per recalcular(); each simulate is 240 cheap iterations → <10ms. No perceptible lag; if any, we debounce.

### UI (`ui.js`)
`updateGoalSeek(input, breakevens)`: header "Hoy gana X por ±$Y. Para que gane Z, necesitarías:". Per lever: label (map key→label) + direction (`≥` if umbral>actual, `≤` if umbral<actual, derived — no hardcoded monotonicity) + formatted threshold + "(hoy actual)". Null → "ni en el rango (min–max) cambia el resultado". Reuse fmtPct/fmtCOP.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | goalSeek + breakevens + BREAKEVEN_VARS + exports + JSDoc |
| `js/ui.js` | Modified | updateGoalSeek + export |
| `js/app.js` | Modified | recalcular calls breakevens + updateGoalSeek |
| `index.html` | Modified | New goal-seek text section |
| `styles/main.css` | Modified | Section styles |
| `tests/goal-seek.test.js` | NEW | TDD |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bisection wrong / off | Med | Test: just-above/just-below the threshold give OPPOSITE-sign diferencia (proves a real crossing) |
| No-crossing case mishandled | Med | Explicit test with an input where buying wins so hard no ETF return in range flips it → expect null |
| Performance lag on fast slider drag | Low | ~100 sims <10ms; debounce only if observed |
| Non-monotonic surprise | Low | Only the 4 known-monotonic levers chosen |

## Rollback Plan

Revert the 4 files, delete the test. Additive.

## Success Criteria

- [ ] `tests/goal-seek.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: all tests pass (78 + new).
- [ ] `breakevens(input)` returns 4 entries with the correct keys.
- [ ] For a non-null threshold, simulate just above and just below it yields opposite-sign `diferencia` (real crossing).
- [ ] No-crossing case returns `null`.
- [ ] Browser: text section shows the 4 levers with correct ≥/≤ direction and current values; null levers show the "ni en el rango" message.
