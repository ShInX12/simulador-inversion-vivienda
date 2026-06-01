# Proposal: Split admin costs (buy vs rent)

## Intent

Today a single "Admin/predial/seguros" slider drives both scenarios: the buyer pays 100% of the value, the renter pays a hardcoded `* 0.5`. That 50% is a rigid assumption baked into the code — in reality the renter's share varies a lot (sometimes the landlord pays the admin, sometimes the renter pays most of it). Split it into two independent inputs so the user controls each side.

## Scope

### In Scope
- Add a new input `adminArriendoInicial` (COP, default $190k = the current 50% of $380k).
- Remove the hardcoded `adminArriendo = adminInicial * 0.5`; use the new input directly.
- The buyer's admin (`adminInicial`, default $380k) is unchanged.
- Both continue to grow monthly with IPC (no change to that mechanic).
- New slider in `index.html`; rename the existing admin label to clarify it's the buyer's.
- TDD strict: regression test (default $190k → identical numbers to before) + independence test.

### Out of Scope
- A "% paid by renter" adjustable input (option b, rejected in favor of two independent sliders).
- README/FORMULAS updates (small docs follow-up).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — refines the input contract; tests carry the new behavior.

## Approach

### Math (in `simulate()`)
```js
// Destructure: add adminArriendoInicial = 190000 (default = old 380000 * 0.5)
let adminArriendo = adminArriendoInicial; // was: adminInicial * 0.5
// Everything else unchanged — adminArriendo *= 1 + ipcMensual stays.
```

yearly[0] currently uses `adminInicial * 0.5` for costoArriendoMes and cargaArriendoPct — switch those to `adminArriendoInicial`.

### Key regression invariant
With `adminArriendoInicial = 190000` (the default), every output MUST be numerically identical to the pre-change calculator (where adminArriendo was `380000 * 0.5 = 190000`). This is the safety net.

### UI
- New slider `admArr` (k-COP), default $190k.
- Rename existing admin label "Admin/predial/seguros" → "Admin/predial/seguros (comprar)" for clarity. New slider labeled "Admin (arrendar)".

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | New input + remove `* 0.5` + yearly[0] fields + JSDoc |
| `js/ui.js` | Modified | INPUT_CONFIG `admArr` + readInputs |
| `index.html` | Modified | New slider + rename existing admin label |
| `tests/admin-split.test.js` | NEW | Regression + independence tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regression: default changes existing numbers | Med | Test asserts default ($190k) produces identical results to hardcoded `380000*0.5`. This is the primary test |
| Missed a spot still using `adminInicial * 0.5` | Low | grep for `* 0.5` after the change; the regression test would also catch it |

## Rollback Plan

Revert the 3 files, delete the test. Additive.

## Success Criteria

- [ ] `tests/admin-split.test.js` written first, FAILS before implementation (RED).
- [ ] Regression: with `adminArriendoInicial = 190000`, all outputs identical to a baseline computed with the old `adminInicial * 0.5` logic (or to documented baseline values).
- [ ] Independence: changing `adminInicial` does NOT change the renter's costs; changing `adminArriendoInicial` does NOT change the buyer's costs.
- [ ] No `* 0.5` hardcode remains for admin.
- [ ] Browser: two separate sliders; default behavior unchanged; each adjusts its own scenario.
