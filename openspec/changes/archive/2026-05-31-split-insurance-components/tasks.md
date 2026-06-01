# Tasks: split-insurance-components (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Rewrite `tests/insurance.test.js`: replace `seguroHipotecaPct: 0.095` in defaults with `seguroVidaPct: 0.05, seguroIncendioPct: 0.045`.
- [x] 1.2 **Initial insurance = vida + incendio**:
   ```js
   const r = simulate({ ...defaults, precio: 250e6, cuotaInicialPct: 20, seguroVidaPct: 0.05, seguroIncendioPct: 0.045 });
   // monto = 200M. vida = 200M×0.05% = 100000. incendio = 250M×0.045% = 112500. total = 212500.
   expect(r.seguroMensualInicial).toBeCloseTo(212500, 0);
   ```
- [x] 1.3 **Vida decreases**: vida>0, incendio=0, admin=0, ipc=0 → costoCompraMes year1 > year20.
- [x] 1.4 **Incendio fixed**: vida=0, incendio>0, admin=0, ipc=0 → costoCompraMes year1 === year20 (constant; only cuota + fixed incendio).
   ```js
   const r = simulate({ ...defaults, seguroVidaPct: 0, seguroIncendioPct: 0.045, adminInicial: 0, adminArriendoInicial: 0, ipcPct: 0 });
   expect(r.yearly[1].costoCompraMes).toBeCloseTo(r.yearly[20].costoCompraMes, 0);
   ```
- [x] 1.5 **Both 0 → no insurance**: seguroVidaPct=0, seguroIncendioPct=0 → seguroMensualInicial === 0.
- [x] 1.6 Run `npm test`. New tests FAIL (fields missing). NOTE: existing tests pinning `seguroHipotecaPct:0` may behave oddly until migrated in Phase 2 — that's expected.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Replace `seguroHipotecaPct = 0.095` in destructuring with `seguroVidaPct = 0.05, seguroIncendioPct = 0.045`.
- [x] 2.2 Before the loop, `const seguroIncendioM = precio * seguroIncendioPct / 100;` (constant).
- [x] 2.3 In the loop, replace `const seguroM = saldo * seguroHipotecaPct/100;` with `const seguroVidaM = saldo * seguroVidaPct/100; const seguroM = seguroVidaM + seguroIncendioM;`. costoCompra and gastoCompraSunkAcum already add seguroM.
- [x] 2.4 yearly[0] costoCompraMes: `cuota + adminInicial + monto*seguroVidaPct/100 + seguroIncendioM`.
- [x] 2.5 Snapshot costoCompraMes already uses `cuota + admin + seguroM` (seguroM now = vida+incendio). Confirm cargaCompraPct too.
- [x] 2.6 Replace `seguroMensualInicial = monto * seguroHipotecaPct/100` with `monto * seguroVidaPct/100 + precio * seguroIncendioPct/100`.
- [x] 2.7 Update JSDoc (two insurance params).
- [x] 2.8 grep for any remaining `seguroHipotecaPct` in js/ — none should remain.
- [x] 2.9 Migrate pinned tests: in `tests/admin-split.test.js` and `tests/calculator.test.js`, change `seguroHipotecaPct: 0` to `seguroVidaPct: 0, seguroIncendioPct: 0`.
- [x] 2.10 Run `npm test`. All pass.

## Phase 3: UI — `js/ui.js` + `index.html`

- [x] 3.1 In `INPUT_CONFIG`, replace `seguro` with `seguroVida: { unit:'pct', format:(v)=>v.toFixed(3)+'%' }` and `seguroIncendio: { unit:'pct', format:(v)=>v.toFixed(3)+'%' }`.
- [x] 3.2 In `readInputs`, replace `seguroHipotecaPct` with `seguroVidaPct: opt('seguroVida',0.05)` and `seguroIncendioPct: opt('seguroIncendio',0.045)`.
- [x] 3.3 In `refreshOutputs`, replace the single seguro output block with two:
   - seguroVida: monto = precio*1e6*(1-ci/100); set `seguroVida-out` to `${v.toFixed(3)}% · ~${fmtCOP(monto*v/100)}/mes`.
   - seguroIncendio: set `seguroIncendio-out` to `${v.toFixed(3)}% · ~${fmtCOP(precio*1e6*v/100)}/mes`.
- [x] 3.4 In `index.html`, replace the single `seguro` slider in Hipoteca with two:
   - `seguroVida` (min 0, max 0.2, step 0.005, value 0.05) label "Seguro de vida (mensual)" hint "% del saldo pendiente. Baja a medida que pagás capital."
   - `seguroIncendio` (min 0, max 0.2, step 0.005, value 0.045) label "Seguro de incendio (mensual)" hint "% del valor de la vivienda. Fijo (no baja con el saldo)."

## Phase 4: Manual verification

- [x] 4.1 `npm test`: all green.
- [x] 4.2 Browser: two sliders "Seguro de vida" and "Seguro de incendio" in Hipoteca; each shows rate + ~$X/mes.
- [x] 4.3 Set vida 0.05%, incendio 0 → cost chart's buy line declines over years (vida shrinks).
- [x] 4.4 Set vida 0, incendio 0.045% → buy line's insurance component stays flat (incendio fixed); with low admin/ipc the buy line is nearly flat.
- [x] 4.5 Both at default → outputs show ~$100k (vida) and ~$113k (incendio).
- [x] 4.6 No console errors; no leftover single "Seguro hipoteca" slider.
