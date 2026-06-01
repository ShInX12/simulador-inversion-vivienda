# Tasks: spending-chart-sunk-costs (TDD strict)

## Phase 1: Tests RED — update existing assertions to NEW semantics

- [x] 1.1 In `tests/spending.test.js`, rename references from `gastoCompraAcum` → `gastoCompraSunkAcum` throughout the file (in test descriptions and assertions). The crossover test also references the field — update.
- [x] 1.2 Update the test "yearly[0]: gastoCompraAcum equals cashInicial" to: "yearly[0].gastoCompraSunkAcum equals escrituración (= cashInicial − cuotaInicial)". Compute expected = `defaults.precio * defaults.escrituracionPct / 100` (e.g., `250e6 * 5.5 / 100 = 13_750_000`). Assert `expect(r.yearly[0].gastoCompraSunkAcum).toBeCloseTo(13750000, 0)` and `expect(r.yearly[0].gastoArriendoAcum).toBe(0)`.
- [x] 1.3 Add a new test inside the "Cumulative spending tracking" describe block: `gastoCompraSunkAcum at year 20 is significantly less than r.totalIntereses + adminAccumulated20y + escrituración (~$445M with defaults)`. Allow ±$50M tolerance for IPC effects on admin. This sanity-checks that the sunk-only formula is correct.
- [x] 1.4 Run `npm test`. Confirm the spending tests FAIL (red — field renamed/missing) and the other 58 still PASS.

## Phase 2: Implementation in `js/calculator.js` — drive to GREEN

- [x] 2.1 Rename the variable `gastoCompraAcum` → `gastoCompraSunkAcum`. Change initialization from `cashInicial` to `escrituracion`.
- [x] 2.2 Update yearly[0] entry: rename `gastoCompraAcum: cashInicial` → `gastoCompraSunkAcum: escrituracion`.
- [x] 2.3 Inside the month loop, REMOVE the existing `gastoCompraAcum += costoCompra` line. Move the accumulation to AFTER the amortization block (so `interesM` is in scope), still BEFORE the IPC bumps. New line: `gastoCompraSunkAcum += interesM + admin;`. Also rename the existing `gastoArriendoAcum += costoArriendo` line if it was bundled with the old gastoCompraAcum tracking — keep the `gastoArriendoAcum` accumulation in its current pre-bump location.
- [x] 2.4 Update the snapshot push field from `gastoCompraAcum` → `gastoCompraSunkAcum`.
- [x] 2.5 Update the spending crossover detection to reference `gastoCompraSunkAcum` (was `gastoCompraAcum`).
- [x] 2.6 Update JSDoc `@returns` line to mention "spendingCrossoverYear (sunk-cost crossover)".
- [x] 2.7 Run `npm test`. Confirm 62 tests, all PASS.

## Phase 3: UI — `js/charts.js` and `index.html`

- [x] 3.1 In `js/charts.js`, update the gastoChart's dataset[0] label: "Comprar acumulado" → "Comprar (intereses + admin + escrituración)".
- [x] 3.2 In `js/charts.js`, in the `updateAll()` block for gastoChart, rename the field reference from `y.gastoCompraAcum` → `y.gastoCompraSunkAcum`.
- [x] 3.3 In `index.html`, update the chart figure:
   - eyebrow "Gasto acumulado" → "Gasto no recuperable"
   - title "Cuánto has pagado en cada escenario" → "Plata perdida en cada escenario"
   - legend swatch text "Comprar acumulado (cuota inicial + cuotas + admin)" → "Comprar (intereses + admin + escrituración)"
   - legend swatch text "Arrendar acumulado (arriendo + admin parcial)" → "Arrendar (arriendo + admin parcial)"
   - aria-label "Gasto acumulado en compra vs arriendo a lo largo del tiempo" → "Plata perdida en compra vs arriendo a lo largo del tiempo"

## Phase 4: Manual verification

- [x] 4.1 `npm test`: 62 tests all green.
- [x] 4.2 Open browser via `python -m http.server 8080`. Default load:
   - Chart title now reads "Plata perdida en cada escenario"
   - Legend shows the new sub-labels (intereses + admin + escrituración / arriendo + admin parcial)
   - Navy line ("Comprar...") starts much lower than before — at ~$13.75M instead of ~$39M (just escrituración, no cuotaInicial)
   - Navy line grows more slowly than before (only intereses + admin, not the full cuota)
   - Amber line is unchanged
   - Dashed crossover marker appears later than before (sunk costs of comprar are lower → arriendo crosses sooner relative to a smaller comprar value... actually buyer's line is LOWER so arriendo never has to catch up as much; crossover comes EARLIER)
- [x] 4.3 Move sliders:
   - Subir tasaEA → línea navy se empina (más intereses)
   - Subir cuotaInicialPct → línea navy NO cambia (cuota inicial no es sunk)
   - Subir escrituracionPct → línea navy se desplaza arriba pero pendiente igual
- [x] 4.4 No console errors.
- [x] 4.5 The crossover marker visually aligns with where the lines actually cross.
