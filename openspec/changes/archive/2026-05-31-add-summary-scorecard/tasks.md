# Tasks: add-summary-scorecard (TDD strict)

## Phase 1: Tests FIRST — must FAIL (RED)

- [x] 1.1 Create `tests/scorecard.test.js`. Reuse the full `defaults`.
- [x] 1.2 **Test: result has numeric patrimonioCompraFinal and patrimonioArriendoFinal**
   ```js
   const r = simulate(defaults);
   expect(Number.isFinite(r.patrimonioCompraFinal)).toBe(true);
   expect(Number.isFinite(r.patrimonioArriendoFinal)).toBe(true);
   ```
- [x] 1.3 **Consistency invariant (toggle ON)**: `diferencia === patrimonioCompraFinal - patrimonioArriendoFinal`
   ```js
   const r = simulate({ ...defaults, aplicarImpuestos: true });
   expect(r.patrimonioCompraFinal - r.patrimonioArriendoFinal).toBeCloseTo(r.diferencia, 0);
   expect(r.patrimonioCompraFinal).toBeCloseTo(r.equityNeto, 0);
   ```
- [x] 1.4 **Consistency invariant (toggle OFF)**: matches gross
   ```js
   const r = simulate({ ...defaults, aplicarImpuestos: false });
   expect(r.patrimonioCompraFinal).toBeCloseTo(r.final.equity, 0);
   expect(r.patrimonioArriendoFinal).toBeCloseTo(r.final.etf, 0);
   expect(r.patrimonioCompraFinal - r.patrimonioArriendoFinal).toBeCloseTo(r.diferencia, 0);
   ```
- [x] 1.5 Run `npm test`. New tests FAIL (fields missing). Existing 75 PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 After computing `diferencia` (and with `equityNeto`, `etfFinalUsdNeto`, `tasaActual` in scope), add:
   ```js
   const patrimonioCompraFinal   = aplicarImpuestos ? equityNeto : final.equity;
   const patrimonioArriendoFinal = aplicarImpuestos ? etfFinalUsdNeto * tasaActual : final.etf;
   ```
- [x] 2.2 Add both to the returned result object (next to `diferencia`).
- [x] 2.3 Update JSDoc `@returns` to mention the two fields.
- [x] 2.4 Run `npm test`. All pass (75 + new).

## Phase 3: HTML — `index.html` (replace .metrics block)

- [x] 3.1 Replace the entire `<div class="metrics">...</div>` block with:
   - `<div class="verdict">` containing `<p class="verdict__label">` (eyebrow) + `<p class="verdict__value" id="v-dif">` + `<p class="verdict__sub" id="v-sub">`
   - `<div class="scorecard">` with two `<div class="scorecard__col">` (Comprar / Arrendar), each with a header and 4 rows. Use ids: `sc-compra-patrimonio`, `sc-compra-perdida`, `sc-compra-entrada`, `sc-compra-mensual` and `sc-arr-patrimonio`, `sc-arr-perdida`, `sc-arr-entrada`, `sc-arr-mensual`.
   - `<div class="details-strip">` with items: `d-int` (Intereses), `d-etf-usd` (ETF final USD), `d-cruce` (arriendo>cuota), `d-cruce-pat` (patrimonio), `d-cruce-gasto` (gasto).

## Phase 4: UI — `js/ui.js` rewrite updateMetrics

- [x] 4.1 Rewrite `updateMetrics(result)` to populate the new ids:
   - Verdict: `v-dif` = (dif>=0?'+':'−') + fmtCOP(|dif|); `v-sub` = (dif>=0?'Comprar gana':'Arrendar gana') + (result.input.aplicarImpuestos?' (post-tax)':' (bruto)'). Keep the green/coral treatment on the `.verdict` container (border/bg) per sign.
   - Scorecard comprar: patrimonio=fmtCOP(patrimonioCompraFinal), perdida=fmtCOP(final.gastoCompraSunkAcum), entrada=fmtCOP(cashInicial), mensual=fmtCOPCuota(cuota).
   - Scorecard arrendar: patrimonio=fmtCOP(patrimonioArriendoFinal), perdida=fmtCOP(final.gastoArriendoAcum), entrada='$0', mensual=fmtCOPCuota(input.arriendoInicial).
   - Details: d-int=fmtCOP(totalIntereses), d-etf-usd=fmtUSD(etfFinalUsd), d-cruce=crossover?('Año '+crossover):'Nunca', d-cruce-pat similarly, d-cruce-gasto from spendingCrossoverYear.
   - Use `result.final` for gastoCompraSunkAcum/gastoArriendoAcum (final = yearly[last]).
- [x] 4.2 Grep for any remaining references to old ids (m-cuota, m-cash, m-int, m-etf-usd, m-cruce, m-cruce-pat, m-dif, m-dif-sub) in ui.js/app.js; remove/replace. Confirm none orphaned.

## Phase 5: CSS — `styles/main.css`

- [x] 5.1 Add `.verdict` styles: prominent banner, green bg/border if compra wins, coral if arriendo (reuse --accent-green-soft / --accent-coral-soft + matching border). Big `.verdict__value`.
- [x] 5.2 Add `.scorecard` styles: 2-column grid (`grid-template-columns: 1fr 1fr`), each `.scorecard__col` a card with header + rows. On mobile (<480px) stack to 1 column. Each row: label (small, muted) + value (display font).
- [x] 5.3 Add `.details-strip` styles: thin horizontal row of small label:value items, wrapping on narrow screens, muted.
- [x] 5.4 Remove now-unused `.metrics` / `.metric` / `.metric--highlight` rules (or leave if other elements use them — grep first; they were only the top metrics, safe to remove).

## Phase 6: Manual verification

- [x] 6.1 `npm test`: all green.
- [x] 6.2 Browser: verdict banner on top (green, "Comprar gana por +$X (post-tax)" with defaults); scorecard 2 columns with the 4 rows each; details strip below with intereses + ETF USD + 3 cruces.
- [x] 6.3 Toggle "Aplicar impuestos" OFF → verdict label changes to "(bruto)" and numbers shift to gross.
- [x] 6.4 Make arriendo win (e.g. retornoEtfUsdPct high) → verdict turns coral, says "Arrendar gana".
- [x] 6.5 Switch modo diferencia/aporte-fijo → scorecard recomputes.
- [x] 6.6 Resize to mobile width → scorecard stacks to 1 column cleanly.
- [x] 6.7 No console errors.
