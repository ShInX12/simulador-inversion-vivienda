# Tasks: add-goal-seek (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/goal-seek.test.js`. Import `simulate`, `goalSeek`, `breakevens` from calculator.js. Reuse full `defaults`.
- [x] 1.2 **breakevens shape**: returns array of 4 entries with keys retornoEtfUsdPct, apreciacionPct, tasaEA, arriendoInicial; each has `umbral` (number|null) and `actual` (number).
- [x] 1.3 **Real crossing**: for a lever whose umbral is not null, simulate just above and just below give opposite-sign diferencia.
   ```js
   const r = breakevens(defaults);
   const etf = r.find(x => x.key === 'retornoEtfUsdPct');
   if (etf.umbral !== null) {
     const below = simulate({ ...defaults, retornoEtfUsdPct: etf.umbral - 0.1 }).diferencia;
     const above = simulate({ ...defaults, retornoEtfUsdPct: etf.umbral + 0.1 }).diferencia;
     expect(Math.sign(below)).not.toBe(Math.sign(above));
   }
   ```
- [x] 1.4 **No-crossing returns null**: construct an input where buying wins so hard that no retornoEtfUsdPct in [0,18] flips it (e.g. apreciacion 10%, tasa 4%, arriendo 0.5M, aporte 0) → goalSeek(..., 'retornoEtfUsdPct', 0, 18) === null. (Adjust the scenario until it genuinely doesn't cross; the test documents the no-crossing path.)
- [x] 1.5 **Threshold within range**: any non-null umbral is within [min, max] of its lever.
- [x] 1.6 Run `npm test`. New tests FAIL (functions missing). Existing 78 PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Add `goalSeek(input, key, min, max)` (bisection per the proposal; handles same-sign → null, exact-0 edges, early-exit on (hi-lo) ≤ 1e-6, max 50 iters).
- [x] 2.2 Add `const BREAKEVEN_VARS = [{key:'retornoEtfUsdPct',min:0,max:18},{key:'apreciacionPct',min:0,max:10},{key:'tasaEA',min:4,max:18},{key:'arriendoInicial',min:0.5e6,max:6e6}];`
- [x] 2.3 Add `breakevens(input)` mapping BREAKEVEN_VARS → `{ key, umbral: goalSeek(input,key,min,max), actual: input[key] }`.
- [x] 2.4 Export `goalSeek` and `breakevens`. Add brief JSDoc.
- [x] 2.5 Run `npm test`. All pass (78 + new).

## Phase 3: UI — `js/ui.js`

- [x] 3.1 Add a label/format map: `{ retornoEtfUsdPct: {label:'Retorno ETF', fmt:(v)=>fmtPct(v,1), min:0,max:18}, apreciacionPct:{label:'Apreciación vivienda', fmt:(v)=>fmtPct(v,1),min:0,max:10}, tasaEA:{label:'Tasa hipoteca',fmt:(v)=>fmtPct(v,1),min:4,max:18}, arriendoInicial:{label:'Arriendo',fmt:(v)=>fmtCOP(v),min:0.5e6,max:6e6} }`.
- [x] 3.2 Add `updateGoalSeek(input, breakevens)`:
   - Determine winner from current `diferencia` (re-simulate or pass it; simpler: accept the result too, or recompute sign from input via simulate). To avoid a second simulate, change signature to `updateGoalSeek(result, breakevens)` and use result.diferencia/gana.
   - Header: `Hoy gana ${gana==='compra'?'comprar':'arrendar'} por ${fmtCOP(|dif|)}. Para que gane ${el otro}, necesitarías:`
   - Per lever: if umbral===null → `${label}: ni en el rango (${fmt(min)}–${fmt(max)}) cambia el resultado`. Else → `${label} ${umbral>actual?'≥':'≤'} ${fmt(umbral)}  (hoy ${fmt(actual)})`.
   - Render into a `<ul id="gs-list">` and a header `#gs-header`.
- [x] 3.3 Export `updateGoalSeek`.

## Phase 4: Wiring + HTML + CSS

- [x] 4.1 In `js/app.js` `recalcular()`, after updateMetrics, add: `UI.updateGoalSeek(result, Calculator.breakevens(inputs));`
- [x] 4.2 In `index.html`, add a section after the `details-strip` (and before the main chart): `<aside class="goalseek"><p class="goalseek__eyebrow">Sensibilidad</p><p class="goalseek__header" id="gs-header"></p><ul class="goalseek__list" id="gs-list"></ul></aside>`.
- [x] 4.3 In `styles/main.css`, add `.goalseek` styles (subtle card, list of levers, monospace thresholds), consistent with the existing editorial look.

## Phase 5: Manual verification

- [x] 5.1 `npm test`: all green.
- [x] 5.2 Browser default: section "¿Qué cambiaría el resultado?" shows header + 4 levers with ≥/≤ thresholds vs current values.
- [x] 5.3 Sanity-check one lever by hand: set the ETF return to the shown threshold → verdict should be ~empate (diferencia ≈ $0).
- [x] 5.4 Make a lever not cross (e.g. extreme inputs) → that lever shows "ni en el rango ... cambia".
- [x] 5.5 Toggle impuestos / switch modo → goal-seek recomputes consistently with the scorecard.
- [x] 5.6 No console errors; no perceptible lag on slider drag.
