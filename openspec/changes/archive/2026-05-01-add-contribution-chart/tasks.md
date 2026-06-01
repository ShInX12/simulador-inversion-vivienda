# Tasks: add-contribution-chart (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/contribution.test.js`. Reuse the standard `defaults` helper.
- [x] 1.2 **Test: each yearly[] entry has numeric aporteAnualUsd**
   ```js
   const r = simulate(defaults);
   for (const y of r.yearly) {
     expect(typeof y.aporteAnualUsd).toBe('number');
     expect(Number.isFinite(y.aporteAnualUsd)).toBe(true);
   }
   ```
- [x] 1.3 **Test: aporte-fijo exact values** — aporte=$250, incr=8%
   ```js
   const r = simulate({ ...defaults, modo: 'aporte-fijo', aporteMensualUsd: 250, aporteIncrementoPct: 8 });
   expect(r.yearly[0].aporteAnualUsd).toBe(0);          // year 0, no months
   expect(r.yearly[1].aporteAnualUsd).toBeCloseTo(3000, 6);  // 12 × 250
   expect(r.yearly[2].aporteAnualUsd).toBeCloseTo(3240, 6);  // 12 × 270
   expect(r.yearly[3].aporteAnualUsd).toBeCloseTo(3499.2, 4); // 12 × 291.6
   ```
- [x] 1.4 **Test: AFC refund NOT counted in aporteAnualUsd**
   ```js
   const base = simulate({ ...defaults, aporteAfcMensual: 0 });
   const withAfc = simulate({ ...defaults, aporteAfcMensual: 1_000_000 });
   // aporteAnualUsd should be identical — AFC refund goes to etfUsd but NOT to aporteAnualUsd
   for (let i = 0; i < base.yearly.length; i++) {
     expect(withAfc.yearly[i].aporteAnualUsd).toBeCloseTo(base.yearly[i].aporteAnualUsd, 6);
   }
   ```
- [x] 1.5 **Test: diferencia mode produces non-negative annual contributions**
   ```js
   const r = simulate({ ...defaults, modo: 'diferencia' });
   for (const y of r.yearly) {
     expect(y.aporteAnualUsd).toBeGreaterThanOrEqual(0);
   }
   ```
- [x] 1.6 Run `npm test`. Confirm the 4 new tests FAIL (red — field missing) and the 63 existing tests still PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Before the month loop, add `let aporteAnualUsd = 0;`.
- [x] 2.2 In the contribution branch, accumulate into `aporteAnualUsd`:
   - `diferencia`: when `dif > 0`, after computing `aporteUsd = dif / tasaActual`, add it: `aporteAnualUsd += aporteUsd` (alongside the existing etfUsd/aportadoTotalUsd increments).
   - `aporte-fijo`: `aporteAnualUsd += aporteActualUsd` (alongside the existing increments).
- [x] 2.3 Add `aporteAnualUsd: 0` to the yearly[0] entry.
- [x] 2.4 In the year-end snapshot push, include `aporteAnualUsd`. Immediately AFTER the push, reset `aporteAnualUsd = 0`.
- [x] 2.5 Confirm the AFC refund block does NOT touch `aporteAnualUsd` (leave it untouched — refund only affects etfUsd/aportadoTotalUsd/refundAfcTotalCop).
- [x] 2.6 Update JSDoc to mention `aporteAnualUsd` in yearly[] fields.
- [x] 2.7 Run `npm test`. Confirm 67 tests, all PASS.

## Phase 3: Chart in `js/charts.js` + `index.html`

- [x] 3.1 In `charts.js`, add a `aporteChart` module-level variable.
- [x] 3.2 In `initAll()`, initialize `aporteChart` as a bar chart on canvas `cAporte`. Single dataset 'Aporte anual al ETF (USD)' with `backgroundColor: c.green, borderWidth: 0`. X-axis title 'Año', Y-axis ticks `callback: (v) => '$' + v`. Tooltip callback: `(ctx) => 'Aporte: $' + ctx.parsed.y + ' USD'`.
- [x] 3.3 In `updateAll(result)`, add the aporteChart block: filter `anio > 0`, labels = those years, dataset data = `aporteYears.map(y => Math.round(y.aporteAnualUsd))`. Then `aporteChart.update('none')`.
- [x] 3.4 In `index.html`, after the `cGasto` figure and before the recommendation, add a new `<figure class="chart-figure">`:
   ```html
   <figure class="chart-figure">
     <figcaption>
       <p class="chart__eyebrow">Aporte al ETF</p>
       <h3 class="chart__title">Cuánto inviertes en el ETF cada año</h3>
       <div class="legend">
         <span class="legend__item"><span class="swatch swatch--green"></span>Aporte anual (USD)</span>
       </div>
     </figcaption>
     <div class="chart-wrap">
       <canvas id="cAporte" role="img" aria-label="Aporte anual al ETF en USD por año"></canvas>
     </div>
   </figure>
   ```

## Phase 4: Manual verification

- [x] 4.1 `npm test`: 67 tests all green.
- [x] 4.2 Open browser via `python -m http.server 8080`. Default load (aporte-fijo, $250, 8%):
   - New bar chart "Cuánto inviertes en el ETF cada año" visible
   - Bars step UP each year (year 1 ≈ $3,000, growing 8%/year)
- [x] 4.3 Switch to "Diferencia" mode:
   - Bars become variable (follow the buy-vs-rent gap, can be 0 in early years if renting is more expensive)
- [x] 4.4 Move the aporte slider (aporte-fijo mode) and the incremento slider → bars respond live.
- [x] 4.5 No console errors in any scenario.
