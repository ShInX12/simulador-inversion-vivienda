# Tasks: ETF dual-mode investment

## Phase 1: Foundation — `js/calculator.js` (pure math)

- [x] 1.1 Extend the input destructuring at the top of `simulate(input)` to read `modo`, `aporteMensual`, `aporteIncrementoPct`, `invertirCashInicial`. Apply safe defaults (`'diferencia'`, `0`, `0`, `true`) when fields are missing so old callers do not break.
- [x] 1.2 Replace `let etf = cashInicial;` with `let etf = invertirCashInicial ? cashInicial : 0;`. Update the month-0 entry of `yearly[]` to use the same gated value.
- [x] 1.3 Introduce `let aporteActual = aporteMensual;` before the month loop. Inside the loop, at the top of each iteration where `m > 1 && (m - 1) % 12 === 0`, multiply `aporteActual *= 1 + aporteIncrementoPct / 100`.
- [x] 1.4 Replace `if (dif > 0) etf += dif;` with a branch: if `modo === 'diferencia'`, keep the existing `Math.max(0, costoCompra - costoArriendo)` contribution; if `modo === 'aporte-fijo'`, add `aporteActual` instead.
- [x] 1.5 Quick mental review: confirm `modo='diferencia'` + `invertirCashInicial=true` runs the EXACT same path as before (regression invariant from spec).

## Phase 2: UI structure — `index.html`

- [x] 2.1 Insert a `<nav class="mode-tabs" data-mode="aporte-fijo">` block at the top of `.panel--controls`, above the presets. Two buttons: `data-mode-target="aporte-fijo"` (active by default) and `data-mode-target="diferencia"`. Add a one-line hint paragraph under it explaining each mode.
- [x] 2.2 Inside the "Inversión alternativa" `<section>`, add two new sliders right after the existing `etf` control: `aporte` (id `aporte`, value 500, min 0, max 5000, step 50, COP en miles → label "Aporte mensual al ETF") and `incr` (id `incr`, value 8, min 0, max 20, step 0.5, label "Aumento anual del aporte"). Wrap both in `<div class="control" data-mode-only="aporte-fijo">`.
- [x] 2.3 Inside the same group, add a `<label class="toggle">` containing a checkbox `id="cashtoggle"` checked by default, with text "Invertir cuota inicial en el ETF al inicio". Do NOT mark it `data-mode-only` — it must be visible in both modes.

## Phase 3: UI logic — `js/ui.js`

- [x] 3.1 Add `aporte`, `incr` entries to `INPUT_CONFIG`. `aporte`: `unit: 'k-COP'`, format `(v) => '$' + Math.round(v) + 'k'`. `incr`: `unit: 'pct'`, format `(v) => fmtPct(v, 1)`.
- [x] 3.2 Extend `readInputs()` to return `modo` (from `document.querySelector('.mode-tabs').dataset.mode`), `aporteMensual` (`get('aporte') * 1000`), `aporteIncrementoPct` (`get('incr')`), `invertirCashInicial` (`document.getElementById('cashtoggle').checked`).
- [x] 3.3 Add `setMode(name)` exported on `window.UI`: updates `.mode-tabs` `data-mode` attribute, toggles `is-active` on the two `[data-mode-target]` buttons, and triggers no recalc itself (caller decides).
- [x] 3.4 Update `refreshOutputs()` to skip slider IDs that don't currently have a DOM element (defensive — though all should exist). No other change.

## Phase 4: Styling — `styles/main.css`

- [x] 4.1 Add `.mode-tabs` styles (segmented control look: rounded container, two equal-width buttons, active button gets accent color background).
- [x] 4.2 Add `.toggle` styles for the cashtoggle checkbox + label combo (custom checkbox or native, paired with text).
- [x] 4.3 Add visibility rules: `.panel--controls[data-mode="diferencia"] [data-mode-only="aporte-fijo"]` → `display:none`. Mirror rule for `[data-mode-only="diferencia"]` if any are added later.

## Phase 5: Wiring — `js/app.js`

- [x] 5.1 In `bindSliders()`, also bind `change` on `#cashtoggle` to call `recalcular()`.
- [x] 5.2 Add `bindModeTabs()`: on each `[data-mode-target]` click, read its `data-mode-target`, mirror it onto `.panel--controls[data-mode]` (so CSS visibility rules fire), call `UI.setMode(name)`, then `recalcular()`.
- [x] 5.3 In `init()`, call `bindModeTabs()` and ensure `.panel--controls` carries `data-mode="aporte-fijo"` at boot.

## Phase 6: Manual verification

- [x] 6.1 **Regression check**: in browser, click "Diferencia" tab with default sliders. Cuota = $2.11M, Cash al cierre = $39M, Año del cruce = 9, Diferencia final = +$152M. MUST match pre-change baseline.
- [x] 6.2 **Pure-compounding check** (`aporte-fijo` mode): set aporte=0, incremento=0, toggle=ON. ETF series in main chart MUST grow as pure compounding of $39M at 10% — year 20 ≈ $262M.
- [x] 6.3 **Step-up check**: set aporte=500k, incremento=8%, modo=`aporte-fijo`. Add `console.log` temporarily inside the loop to print month and aporteActual at m=12, 13, 24, 25. MUST see 500_000 → 540_000 at m=13, then 540_000 → 583_200 at m=25. Remove logs after verification.
- [x] 6.4 **Toggle OFF check**: set toggle=OFF. ETF month-0 in chart MUST be $0, not $39M. Year 1 ETF only reflects the year of contributions.
- [x] 6.5 **Visual smoke test**: drag every slider in both modes; no console errors; charts re-render; tabs hide/show inputs cleanly with no layout jump.
- [x] 6.6 **Sanity numbers from FORMULAS.md §10**: $100M / 10% EA / 20y → cuota ≈ $937k. Verify by setting precio=100, ci=0, tasa=10, plazo=20 (adjust precio slider min if needed).
