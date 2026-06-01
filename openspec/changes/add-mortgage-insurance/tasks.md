# Tasks: add-mortgage-insurance (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/insurance.test.js`. Reuse full `defaults` + add `seguroHipotecaPct: 0.095`.
- [x] 1.2 **FNA reproduction**: with monto $200M (precio 250M, ci 20%) and rate 0.095%, `result.seguroMensualInicial` ≈ $190,000.
   ```js
   const r = simulate({ ...defaults, precio: 250e6, cuotaInicialPct: 20, tasaEA: 9.5, seguroHipotecaPct: 0.095 });
   expect(r.seguroMensualInicial).toBeCloseTo(190000, 0); // 200M × 0.095% = 190000
   ```
- [x] 1.3 **Insurance adds to sunk**: sunk with rate 0.095 > sunk with rate 0.
   ```js
   const withIns = simulate({ ...defaults, seguroHipotecaPct: 0.095 });
   const noIns   = simulate({ ...defaults, seguroHipotecaPct: 0 });
   expect(withIns.final.gastoCompraSunkAcum).toBeGreaterThan(noIns.final.gastoCompraSunkAcum);
   ```
- [x] 1.4 **Insurance decreases over time**: with admin=0, ipc=0, the buy monthly cost in year 1 > year 20 (seguro shrinks with balance, cuota fixed).
   ```js
   const r = simulate({ ...defaults, adminInicial: 0, adminArriendoInicial: 0, ipcPct: 0, seguroHipotecaPct: 0.095 });
   expect(r.yearly[1].costoCompraMes).toBeGreaterThan(r.yearly[20].costoCompraMes);
   ```
- [x] 1.5 **Rate 0 = no insurance effect**: seguroMensualInicial === 0; sunk equals the no-insurance baseline.
- [x] 1.6 Run `npm test`. New tests FAIL (field/input missing). Existing 88 PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Add `seguroHipotecaPct = 0.095` to the destructuring (default).
- [x] 2.2 In the loop, compute `const seguroM = saldo * seguroHipotecaPct / 100;` using the balance at the start of the month (before this month's amortization). Add `seguroM` to `costoCompra` (= cuota + admin + seguroM).
- [x] 2.3 Add `seguroM` to `gastoCompraSunkAcum` (alongside interesM + admin).
- [x] 2.4 In the yearly snapshot, `costoCompraMes` becomes `cuota + admin + (saldo × seguroHipotecaPct/100)` for that month's balance. yearly[0] uses `monto × seguroHipotecaPct/100`.
- [x] 2.5 After the loop, add `const seguroMensualInicial = monto * seguroHipotecaPct / 100;` and include it in the result object.
- [x] 2.6 Update JSDoc with the new input + the result field.
- [x] 2.7 Run `npm test`. All pass (88 + new).

## Phase 3: UI — `js/ui.js` + `index.html`

- [x] 3.1 In `INPUT_CONFIG`, add `seguro: { unit: 'pct', format: (v) => v.toFixed(3) + '%' }`.
- [x] 3.2 In `readInputs`, add `seguroHipotecaPct: opt('seguro', 0.095)`.
- [x] 3.3 In `refreshOutputs`, after the ci/esc block, add a seguro helper: read `seguro`, `precio`, `ci`; compute monto = `precio*1e6*(1 - ci/100)`; seguroInicial = `monto * seguro/100`; set `seguro-out` to `${seguro.toFixed(3)}% · ~${montoMStr-or-k(seguroInicial)}/mes`. (Show as $XXXk for sub-million amounts.)
- [x] 3.4 In `index.html`, add a `seguro` slider in the "Hipoteca" control-group (after Plazo): id `seguro`, min 0, max 0.25, step 0.005, value 0.095, label "Seguro hipoteca (mensual)", hint "% del saldo pendiente. Vida deudor + incendio. Baja a medida que pagás capital.".

## Phase 4: Manual verification

- [ ] 4.1 `npm test`: all green.
- [ ] 4.2 Browser: slider "Seguro hipoteca (mensual)" in Hipoteca section; output shows "0.095% · ~$X/mes".
- [ ] 4.3 FNA scenario: set precio 250M, ci 20%, tasa 9.5%, seguro 0.095% → output shows ~$190k/mes; the "Comprar vs arrendar" cost line includes it.
- [ ] 4.4 Set seguro to 0 → insurance disappears from costs.
- [ ] 4.5 Observe the buy cost line in "Comprar vs arrendar" declines slightly over years (seguro shrinks) — visible if admin/ipc low.
- [ ] 4.6 No console errors.
