# Tasks: add-salary-burden-chart (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/salary-burden.test.js`. Reuse `defaults` and add `salarioMensual: 5e6, crecimientoSalarialPct: 5` to it.
- [x] 1.2 **Test: each yearly[] entry has numeric cargaCompraPct and cargaArriendoPct**
- [x] 1.3 **Test: year 0 exact values**
   ```js
   const r = simulate(defaults);
   expect(r.yearly[0].cargaCompraPct).toBeCloseTo((r.cuota + 380000) / 5e6 * 100, 4);
   expect(r.yearly[0].cargaArriendoPct).toBeCloseTo((1.6e6 + 190000) / 5e6 * 100, 4);
   ```
- [x] 1.4 **Test: equal-growth invariant** — when `crecimientoSalarialPct === ipcPct`, renter burden is constant
   ```js
   const r = simulate({ ...defaults, ipcPct: 5, crecimientoSalarialPct: 5 });
   for (let i = 1; i < r.yearly.length; i++) {
     expect(r.yearly[i].cargaArriendoPct).toBeCloseTo(r.yearly[0].cargaArriendoPct, 2);
   }
   ```
- [x] 1.5 **Test: buyer burden declines** — with salary growing, cargaCompraPct[20] < cargaCompraPct[0]
   ```js
   const r = simulate({ ...defaults, crecimientoSalarialPct: 5 });
   expect(r.yearly[20].cargaCompraPct).toBeLessThan(r.yearly[0].cargaCompraPct);
   ```
- [x] 1.6 **Test: zero salary growth** — cargaCompraPct should still decline slightly? No: with crecimiento=0 and cuota fixed, cuota/salario is flat but admin grows with IPC → cargaCompraPct INCREASES. Assert: with crecimientoSalarialPct=0, cargaCompraPct[20] > cargaCompraPct[0] (admin inflates, salary flat).
- [x] 1.7 Run `npm test`. Confirm new tests FAIL (red) and existing 67 PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Add `salarioMensual = 5e6` and `crecimientoSalarialPct = 5` to the destructuring (with defaults).
- [x] 2.2 Add `const salMensual = eaToMonthly(crecimientoSalarialPct);` near the other monthly-rate constants.
- [x] 2.3 Add `let salario = salarioMensual;` before the loop.
- [x] 2.4 In yearly[0], add `cargaCompraPct: ((cuota + adminInicial) / salarioMensual) * 100` and `cargaArriendoPct: ((arriendoInicial + adminInicial * 0.5) / salarioMensual) * 100`.
- [x] 2.5 In the loop, alongside the IPC bumps (after `adminArriendo *= ...`), add `salario *= 1 + salMensual;`.
- [x] 2.6 In the snapshot push, add `cargaCompraPct: ((cuota + admin) / salario) * 100` and `cargaArriendoPct: ((arriendo + adminArriendo) / salario) * 100`. (admin/arriendo/salario all post-bump here — consistent with costoCompraMes.)
- [x] 2.7 Update JSDoc with the 2 new inputs + the new yearly fields.
- [x] 2.8 Run `npm test`. Confirm all tests PASS.

## Phase 3: UI inputs — `js/ui.js` + `index.html`

- [x] 3.1 In `js/ui.js` INPUT_CONFIG, add `salario: { unit: 'M-COP', format: (v) => '$' + v.toFixed(1) + 'M' }` and `crecSal: { unit: 'pct', format: (v) => fmtPct(v, 1) }`.
- [x] 3.2 In `readInputs()`, add `salarioMensual: get('salario') * 1e6` and `crecimientoSalarialPct: get('crecSal')` (use `opt()` defensively if preferred: `opt('salario', 5) * 1e6`, `opt('crecSal', 5)`).
- [x] 3.3 In `index.html`, add a new control-group "Tu salario" (after "Impuestos y costos al cierre" or wherever fits): slider `salario` (id `salario`, min 1, max 30, step 0.25, value 5, label "Salario mensual") and slider `crecSal` (id `crecSal`, min 0, max 15, step 0.5, value 5, label "Crecimiento anual del salario"). Hints explaining each.

## Phase 4: Chart — `js/charts.js` + `index.html` figure

- [x] 4.1 Add `cargaChart` module-level variable.
- [x] 4.2 In `initAll()`, init `cargaChart` as a line chart on canvas `cCarga`. 2 datasets: 'Comprar (% del salario)' navy solid, 'Arrendar (% del salario)' amber dashed. Y-axis ticks `(v) => v + '%'`. Tooltip: `(ctx) => ctx.dataset.label + ': ' + ctx.parsed.y + '%'`.
- [x] 4.3 In `updateAll(result)`, add cargaChart block: labels = all years; dataset[0] = `result.yearly.map(y => +(y.cargaCompraPct).toFixed(1))`; dataset[1] = same for cargaArriendoPct. `cargaChart.update('none')`.
- [x] 4.4 In `index.html`, add a new `<figure>` with canvas `cCarga` after the `cAporte` figure and before the recommendation. Eyebrow "Carga financiera", title "Cuánto pesa en tu salario", legend with both datasets.

## Phase 5: Manual verification

- [x] 5.1 `npm test`: all green.
- [x] 5.2 Browser default ($5M salary, 5% growth): chart "Cuánto pesa en tu salario" visible.
   - Carga comprar starts ~49.7%, DECLINES over years (cuota fixed, salary grows)
   - Carga arrendar starts ~35.8%, stays ~FLAT (arriendo and salary grow at same 5%)
- [x] 5.3 Set crecimiento salarial to 0 → carga comprar rises slightly (admin inflates, salary flat); carga arrendar rises (arriendo inflates, salary flat).
- [x] 5.4 Set salary higher → both curves shift down.
- [x] 5.5 No console errors.
