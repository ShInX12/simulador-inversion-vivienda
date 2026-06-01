# Tasks: improve-crossover-metrics (TDD strict)

## Phase 1: Tests FIRST — must FAIL before implementation (RED)

- [x] 1.1 Create `tests/crossover-metrics.test.js`. Import `simulate` and reuse the same `defaults` helper from `calculator.test.js` (or define locally).
- [x] 1.2 **Test: default scenario produces a finite crossoverPatrimonio**
   ```js
   const r = simulate(defaults);
   expect(typeof r.crossoverPatrimonio === 'number' || r.crossoverPatrimonio === null).toBe(true);
   if (r.crossoverPatrimonio !== null) {
     expect(r.crossoverPatrimonio).toBeGreaterThanOrEqual(1);
     expect(r.crossoverPatrimonio).toBeLessThanOrEqual(20);
   }
   ```
- [x] 1.3 **Test: when ETF dominates always (extreme high return), crossoverPatrimonio === null**
   ```js
   // Set retornoEtfUsdPct very high so ETF always > equity
   const r = simulate({ ...defaults, retornoEtfUsdPct: 30, aplicarImpuestos: false });
   // Expect: equity < etf at every year → no sign flip → null
   expect(r.crossoverPatrimonio).toBeNull();
   ```
- [x] 1.4 **Test: detection captures the first sign flip (not later ones)**
   - Manually verify with a scenario where signs flip and the test asserts the first-flip year.
   - Use defaults (which produce a single typical crossover) and assert the year matches what we compute by traversing yearly[] manually in the test.
- [x] 1.5 Run `npm test`. Confirm 3 new tests FAIL (red — `crossoverPatrimonio` doesn't exist yet) and the 55 existing tests still PASS.

## Phase 2: Implementation in `js/calculator.js` — drive RED to GREEN

- [x] 2.1 In `simulate()`, AFTER the existing crossover detection loop and BEFORE the return statement, add:
   ```js
   let crossoverPatrimonio = null;
   for (let i = 1; i < yearly.length; i++) {
     const prevSign = Math.sign(yearly[i-1].equity - yearly[i-1].etf);
     const currSign = Math.sign(yearly[i].equity - yearly[i].etf);
     if (prevSign !== currSign && prevSign !== 0 && currSign !== 0) {
       crossoverPatrimonio = yearly[i].anio;
       break;
     }
   }
   ```
- [x] 2.2 Add `crossoverPatrimonio` to the returned result object (alongside `crossover`).
- [x] 2.3 Update JSDoc to mention the new field briefly in the `@returns` section.
- [x] 2.4 Run `npm test`. Expect 58 tests, all PASS.

## Phase 3: UI — `js/ui.js` and `index.html`

- [x] 3.1 In `js/ui.js` `updateMetrics()`, add (next to the existing `m-cruce` line):
   ```js
   const cruzPatEl = document.getElementById('m-cruce-pat');
   if (cruzPatEl) {
     cruzPatEl.textContent = result.crossoverPatrimonio ? 'Año ' + result.crossoverPatrimonio : 'Nunca';
   }
   ```
- [x] 3.2 In `index.html`, change the existing card's label:
   ```html
   <p class="metric__label">Año del cruce</p>
   ```
   to
   ```html
   <p class="metric__label">Año arriendo &gt; cuota</p>
   ```
- [x] 3.3 In `index.html`, insert a new metric card AFTER the existing `m-cruce` card and BEFORE the `m-dif` highlight card:
   ```html
   <article class="metric">
     <p class="metric__label">Cruce de patrimonio</p>
     <p class="metric__value" id="m-cruce-pat">Nunca</p>
   </article>
   ```

## Phase 4: Manual verification

- [x] 4.1 `npm test`: 58 tests all green.
- [x] 4.2 Open browser via `python -m http.server 8080`. Default load:
   - The card formerly "Año del cruce" now reads "Año arriendo > cuota" with the same year value.
   - A new card "Cruce de patrimonio" appears between the "Año arriendo > cuota" card and the "Diferencia final" card. Shows a year (or "Nunca").
- [x] 4.3 Move sliders that affect ETF growth (retornoEtfUsdPct very high or low) and verify the patrimonio crossover responds.
- [x] 4.4 Compare visually: the "Cruce de patrimonio" year should match where the two lines cross in the "Cómo evoluciona tu riqueza" chart (within 1 year tolerance, since chart points are annual).
- [x] 4.5 No console errors when interacting with any slider.
