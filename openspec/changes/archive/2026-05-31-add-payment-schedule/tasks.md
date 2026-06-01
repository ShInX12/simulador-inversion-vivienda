# Tasks: add-payment-schedule (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/schedule.test.js`. Import `simulate`, `amortizationSchedule` from calculator.js. Reuse a defaults object (include seguroVidaPct, seguroIncendioPct).
- [x] 1.2 **Length**: `amortizationSchedule(defaults).length === plazoAnios * 12`.
- [x] 1.3 **Capital sums to financed amount**: Σ row.capital ≈ monto (= precio − cuotaInicial). Tolerance ±$1.
- [x] 1.4 **Interest sums to totalIntereses**: Σ row.interes ≈ cuota×meses − monto (matches simulate's totalIntereses). Cross-check with `simulate(defaults).totalIntereses`.
- [x] 1.5 **Final balance ≈ 0**: last row.saldo ≈ 0 (±$1).
- [x] 1.6 **cuotaTotal identity**: every row, `cuotaTotal ≈ cuota + seguroVida + seguroIncendio`.
- [x] 1.7 **Insurance behavior**: row[0].seguroVida > last.seguroVida (decreases); row[0].seguroIncendio === last.seguroIncendio (fixed).
- [x] 1.8 Run `npm test`. New tests FAIL (function missing). Existing 93 PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Add `amortizationSchedule(input)` per the proposal (pure; mortgage + insurance only; seguro vida on month-start balance; incendio fixed; cuota via monthlyPayment).
- [x] 2.2 Export `amortizationSchedule`. Add JSDoc.
- [x] 2.3 Run `npm test`. All pass (93 + new).

## Phase 3: UI — `js/ui.js`

- [x] 3.1 Add `renderAmortTable(schedule)`: clear `#schedule-body`, build a `<tr>` per row with 8 `<td>`: mes, cuota, interes, capital, seguroVida, seguroIncendio, cuotaTotal, saldo. Format COP as `$` + rounded integer with `toLocaleString('en-US')`. Append via a documentFragment for speed.
- [x] 3.2 Add `exportScheduleCSV(schedule)`: build a CSV string (header row + data rows, comma-separated, rounded integers), create a Blob (`text/csv;charset=utf-8`), and trigger download via a temporary `<a>` with `download="plan-de-pagos.csv"`.
- [x] 3.3 Export both.

## Phase 4: Wiring + HTML + CSS

- [x] 4.1 In `js/app.js` `recalcular()`: after the charts, if `document.getElementById('schedule-details')?.open`, call `UI.renderAmortTable(Calculator.amortizationSchedule(inputs))`.
- [x] 4.2 Add `bindSchedule()` in app.js: on the `<details id="schedule-details">` `toggle` event, if now open, render (so it fills the first time it's opened); on the CSV button click, call `UI.exportScheduleCSV(Calculator.amortizationSchedule(UI.readInputs()))`. Call `bindSchedule()` in init().
- [x] 4.3 In `index.html`, after the goal-seek `<aside>`, add:
   ```html
   <details class="schedule" id="schedule-details">
     <summary class="schedule__summary">Ver plan de pagos (mes a mes)</summary>
     <div class="schedule__actions">
       <button type="button" id="schedule-csv" class="schedule__csv">Exportar CSV</button>
     </div>
     <div class="schedule__wrap">
       <table class="schedule__table">
         <thead><tr>
           <th>Mes</th><th>Cuota</th><th>Interés</th><th>Capital</th>
           <th>Seg. vida</th><th>Seg. incendio</th><th>Cuota + seguros</th><th>Saldo</th>
         </tr></thead>
         <tbody id="schedule-body"></tbody>
       </table>
     </div>
   </details>
   ```
- [x] 4.4 In `styles/main.css`, add `.schedule` styles: summary as a clickable header; `.schedule__wrap` with `max-height` + `overflow:auto`; `.schedule__table` full width, small mono numbers, sticky `thead`, zebra rows; CSV button styled like a small action.

## Phase 5: Manual verification

- [x] 5.1 `npm test`: all green.
- [x] 5.2 Browser: "Ver plan de pagos" section appears (collapsed). Click → expands a scrollable table with 240 rows × 8 columns.
- [x] 5.3 Row 1 sanity: Interés + Capital = Cuota; Cuota + seguros = Cuota + Seg.vida + Seg.incendio; matches what the metrics/cost chart imply.
- [x] 5.4 Scroll to last row: Saldo ≈ $0; Capital ≈ full cuota; Seg. vida ≈ $0; Seg. incendio still at its fixed value.
- [x] 5.5 FNA scenario (precio 250M, ci 20%, tasa 9.5%): row 1 "Cuota + seguros" ≈ the FNA total.
- [x] 5.6 "Exportar CSV" → downloads `plan-de-pagos.csv`; opens in Excel; values match the table.
- [x] 5.7 Move a slider with the section open → table updates; no noticeable lag. Closed → no render cost.
- [x] 5.8 No console errors.
