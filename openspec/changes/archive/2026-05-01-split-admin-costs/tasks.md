# Tasks: split-admin-costs (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/admin-split.test.js`. Reuse `defaults` (which has adminInicial: 380000). Add `adminArriendoInicial: 190000` to the defaults object.
- [x] 1.2 **Regression test: default adminArriendoInicial=190000 reproduces old behavior**
   ```js
   // Old behavior: adminArriendo = adminInicial * 0.5 = 190000.
   // New default adminArriendoInicial = 190000 → must match.
   const r = simulate(defaults);
   // costoArriendoMes year 0 = arriendo + adminArriendo = 1.6M + 190k = 1.79M
   expect(r.yearly[0].costoArriendoMes).toBeCloseTo(1.6e6 + 190000, 0);
   ```
- [x] 1.3 **Independence test: changing buyer admin does NOT affect renter costs**
   ```js
   const base = simulate(defaults);
   const moreBuyerAdmin = simulate({ ...defaults, adminInicial: 800000 });
   // Renter's costoArriendoMes year 0 must be unchanged
   expect(moreBuyerAdmin.yearly[0].costoArriendoMes).toBeCloseTo(base.yearly[0].costoArriendoMes, 0);
   // But buyer's costoCompraMes year 0 must change
   expect(moreBuyerAdmin.yearly[0].costoCompraMes).not.toBeCloseTo(base.yearly[0].costoCompraMes, 0);
   ```
- [x] 1.4 **Independence test: changing renter admin does NOT affect buyer costs**
   ```js
   const base = simulate(defaults);
   const moreRenterAdmin = simulate({ ...defaults, adminArriendoInicial: 400000 });
   expect(moreRenterAdmin.yearly[0].costoCompraMes).toBeCloseTo(base.yearly[0].costoCompraMes, 0);
   expect(moreRenterAdmin.yearly[0].costoArriendoMes).toBeCloseTo(1.6e6 + 400000, 0);
   ```
- [x] 1.5 Run `npm test`. The independence tests should FAIL (renter admin still derived from buyer admin via * 0.5). Existing 72 pass.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Add `adminArriendoInicial = 190000` to the destructuring (with default).
- [x] 2.2 Replace `let adminArriendo = adminInicial * 0.5;` with `let adminArriendo = adminArriendoInicial;`.
- [x] 2.3 In yearly[0], replace `adminInicial * 0.5` in `costoArriendoMes` and `cargaArriendoPct` with `adminArriendoInicial`.
- [x] 2.4 grep for any remaining `* 0.5` related to admin and confirm none remain.
- [x] 2.5 Update JSDoc: add `adminArriendoInicial` param; clarify `adminInicial` is the buyer's.
- [x] 2.6 Run `npm test`. Confirm all tests pass (including the new independence + regression tests, and the existing 72).

## Phase 3: UI — `js/ui.js` + `index.html`

- [x] 3.1 In `js/ui.js` INPUT_CONFIG, add `admArr: { unit: 'k-COP', format: (v) => '$' + Math.round(v) + 'k' }`.
- [x] 3.2 In `readInputs()`, add `adminArriendoInicial: opt('admArr', 190) * 1000` (k → COP, defensive opt with 190 fallback).
- [x] 3.3 In `index.html`, rename the existing admin control label "Admin/predial/seguros" → "Admin/predial/seguros (comprar)" and update its hint to clarify it's the owner's cost. Add a new control `admArr` right after it: id `admArr`, min 0, max 1500, step 20, value 190, label "Admin (arrendar)", hint "Lo que paga el arrendatario (admin/servicios, sin predial ni seguro estructural)."

## Phase 4: Manual verification

- [x] 4.1 `npm test`: all green.
- [x] 4.2 Browser default: two admin sliders ($380k comprar, $190k arrendar). The numbers/charts must look IDENTICAL to before this change (regression).
- [x] 4.3 Move "Admin (arrendar)" up → renter costs rise, buyer costs unchanged. Charts (costo mensual, plata perdida, carga) reflect it on the renter side only.
- [x] 4.4 Move "Admin (comprar)" → buyer costs rise, renter unchanged.
- [x] 4.5 No console errors.
