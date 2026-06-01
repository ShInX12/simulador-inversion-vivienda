# Tasks: add-spending-chart (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/spending.test.js`. Reuse the same `defaults` helper as other tests.
- [x] 1.2 **Test: gastoCompraAcum and gastoArriendoAcum present in yearly[] entries**
   ```js
   const r = simulate(defaults);
   for (const y of r.yearly) {
     expect(typeof y.gastoCompraAcum).toBe('number');
     expect(typeof y.gastoArriendoAcum).toBe('number');
   }
   ```
- [x] 1.3 **Test: monotonic non-decreasing (you can only spend more, never less)**
   ```js
   const r = simulate(defaults);
   for (let i = 1; i < r.yearly.length; i++) {
     expect(r.yearly[i].gastoCompraAcum).toBeGreaterThanOrEqual(r.yearly[i-1].gastoCompraAcum);
     expect(r.yearly[i].gastoArriendoAcum).toBeGreaterThanOrEqual(r.yearly[i-1].gastoArriendoAcum);
   }
   ```
- [x] 1.4 **Test: yearly[0] has gastoCompraAcum === cashInicial and gastoArriendoAcum === 0**
   ```js
   const r = simulate(defaults);
   expect(r.yearly[0].gastoCompraAcum).toBeCloseTo(r.cashInicial, 0);
   expect(r.yearly[0].gastoArriendoAcum).toBe(0);
   ```
- [x] 1.5 **Test: spendingCrossoverYear field present and consistent**
   ```js
   const r = simulate(defaults);
   const valid = r.spendingCrossoverYear === null ||
     (typeof r.spendingCrossoverYear === 'number' &&
      r.spendingCrossoverYear >= 1 && r.spendingCrossoverYear <= 20);
   expect(valid).toBe(true);
   if (r.spendingCrossoverYear !== null) {
     // Verify it's the FIRST flip
     const a = r.spendingCrossoverYear;
     const prev = r.yearly[a-1];
     const curr = r.yearly[a];
     const prevSign = Math.sign(prev.gastoCompraAcum - prev.gastoArriendoAcum);
     const currSign = Math.sign(curr.gastoCompraAcum - curr.gastoArriendoAcum);
     expect(prevSign).not.toBe(currSign);
   }
   ```
- [x] 1.6 Run `npm test`. Confirm 4 NEW tests FAIL (red — fields don't exist yet) and the 58 existing tests still PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Before the month loop, initialize:
   ```js
   let gastoCompraAcum = cashInicial; // upfront cost al mes 0
   let gastoArriendoAcum = 0;
   ```
- [x] 2.2 In the yearly[0] entry, add `gastoCompraAcum: cashInicial` and `gastoArriendoAcum: 0`.
- [x] 2.3 Inside the month loop, AFTER computing `costoCompra` and `costoArriendo` (pre-IPC-bump) and BEFORE the IPC bumps, add:
   ```js
   gastoCompraAcum += costoCompra;
   gastoArriendoAcum += costoArriendo;
   ```
- [x] 2.4 In the snapshot push, include `gastoCompraAcum` and `gastoArriendoAcum`.
- [x] 2.5 After the loop (next to crossoverPatrimonio detection), add spending crossover detection using sign of `(gastoCompraAcum - gastoArriendoAcum)`. Store in variable `spendingCrossoverYear`.
- [x] 2.6 Add `spendingCrossoverYear` to the result object.
- [x] 2.7 Update JSDoc `@returns` line to mention the new field.
- [x] 2.8 Run `npm test`. Confirm 62 tests, all PASS.

## Phase 3: Custom plugin + new chart in `js/charts.js`

- [x] 3.1 At the top of `charts.js` (after the existing imports/state), define and register a custom plugin:
   ```js
   const verticalLinePlugin = {
     id: 'verticalLine',
     afterDraw(chart, args, options) {
       const year = options.crossoverYear;
       if (!year && year !== 0) return;
       const xScale = chart.scales.x;
       const yScale = chart.scales.y;
       const xPx = xScale.getPixelForValue(year);
       const ctx = chart.ctx;
       ctx.save();
       ctx.beginPath();
       ctx.moveTo(xPx, yScale.top);
       ctx.lineTo(xPx, yScale.bottom);
       ctx.strokeStyle = options.color || '#888';
       ctx.lineWidth = 1.5;
       ctx.setLineDash([4, 4]);
       ctx.stroke();
       if (options.label) {
         ctx.fillStyle = options.color || '#888';
         ctx.font = '11px sans-serif';
         ctx.fillText(options.label, xPx + 4, yScale.top + 12);
       }
       ctx.restore();
     }
   };
   Chart.register(verticalLinePlugin);
   ```
- [x] 3.2 Add a `gastoChart` module-level variable and initialize it in `initAll()` after rentChart. New line chart with 2 datasets ('Comprar acumulado' navy, 'Arrendar acumulado' amber dashed). Y-axis ticks formatted as `'$' + v + 'M'`. Plugin options reference `verticalLine: { crossoverYear: null, color: c.coral, label: 'Cruce' }` initially.
- [x] 3.3 In `updateAll(result)`, add the gastoChart update block: labels = result.yearly.map(y => y.anio); dataset[0].data = result.yearly.map(y => +(y.gastoCompraAcum / 1e6).toFixed(0)); dataset[1].data = same for gastoArriendoAcum. Update `gastoChart.options.plugins.verticalLine.crossoverYear = result.spendingCrossoverYear`. Then `gastoChart.update('none')`.

## Phase 4: HTML — `index.html`

- [x] 4.1 After the existing `<div class="chart-row">` (containing cAmort + cRent) and BEFORE the `<aside class="recommendation">`, insert a new `<figure class="chart-figure">`:
   ```html
   <figure class="chart-figure">
     <figcaption>
       <p class="chart__eyebrow">Gasto acumulado</p>
       <h3 class="chart__title">Cuánto has pagado en cada escenario</h3>
       <div class="legend">
         <span class="legend__item"><span class="swatch swatch--navy"></span>Comprar acumulado</span>
         <span class="legend__item"><span class="swatch swatch--amber swatch--dashed"></span>Arrendar acumulado</span>
       </div>
     </figcaption>
     <div class="chart-wrap chart-wrap--tall">
       <canvas id="cGasto" role="img" aria-label="Gasto acumulado en compra vs arriendo a lo largo del tiempo"></canvas>
     </div>
   </figure>
   ```

## Phase 5: Manual verification

- [ ] 5.1 `npm test`: 62 tests all green.
- [ ] 5.2 Open browser via `python -m http.server 8080`. Default load:
   - 4th chart "Cuánto has pagado en cada escenario" visible below the cAmort+cRent row, full-width
   - Two lines: navy solid (Comprar) starting around $39M, amber dashed (Arrendar) starting at $0
   - Both lines monotonically increasing
   - Dashed vertical line at the crossover year (if exists with defaults)
- [ ] 5.3 Move sliders affecting spending (precio, arriendo, cuotaInicialPct):
   - Increase precio → Comprar line shifts up; crossover may change
   - Increase arriendo significantly → Arrendar line steepens; crossover comes earlier
   - Set cuotaInicialPct to 0 → Comprar line starts near $0 (only escrituración as upfront)
- [ ] 5.4 No console errors in any scenario.
- [ ] 5.5 The vertical marker (dashed line) visually aligns with where the two lines cross within ±1 year tolerance.
