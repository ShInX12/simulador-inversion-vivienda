# Proposal: Re-theme (Slate & Teal) + objective verdict

## Intent

Two visual changes: (1) re-theme the app from the warm "editorial" palette to a modern "Slate & Teal" fintech look (light + dark, automatic via the OS); (2) redesign the "¿Qué te conviene?" verdict from a green/coral (good/bad) banner to an objective dual comparison — neither option is objectively bad, so the color shouldn't imply value.

## Scope

### In Scope
- Redefine all CSS color tokens to the Slate & Teal palette, for both light (`:root`) and dark (`@media prefers-color-scheme: dark`). Keep token names (charts/components read them unchanged).
- Verdict redesign: two scenarios side by side (Comprar / Arrendar + ETF) with their patrimonios, a proportional bar that leans to the winner, and a "Gana X por $Y" line. Neutral background; each scenario keeps its identity color (teal / indigo) — no good/bad coloring.
- Update `updateMetrics` to fill the new verdict structure; remove the green/coral conditional styling.

### Out of Scope
- Manual theme toggle (a future change; needs the chart re-paint fix).
- Changing fonts or layout structure.
- Any math (verdict uses existing patrimonioCompraFinal / patrimonioArriendoFinal).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — visual layer. The 101 tests stay green (calculator.js untouched).

## Approach

### Tokens (`styles/main.css`)
Slate & Teal, both modes (values in the change scope memory). Mapping kept by token name:
- `--accent-green` = teal (Comprar / equity)
- `--accent-navy` = indigo (Arrendar + ETF)
- `--accent-coral` = orange (Intereses; no longer "bad")
- `--accent-amber` = amber (Arriendo)
Charts read these via `getComputedStyle` → re-color automatically.

### Verdict (`index.html` + `ui.js`)
New markup:
```html
<div class="verdict" id="verdict">
  <p class="verdict__label">¿Qué te conviene?</p>
  <div class="verdict__compare">
    <div class="verdict__side verdict__side--compra">
      <span class="verdict__name">Comprar</span>
      <span class="verdict__val" id="v-compra"></span>
    </div>
    <div class="verdict__side verdict__side--arr">
      <span class="verdict__name">Arrendar + ETF</span>
      <span class="verdict__val" id="v-arr"></span>
    </div>
  </div>
  <div class="verdict__bar">
    <div class="verdict__bar-seg verdict__bar-seg--compra" id="v-bar-compra"></div>
    <div class="verdict__bar-seg verdict__bar-seg--arr" id="v-bar-arr"></div>
  </div>
  <p class="verdict__result" id="v-result"></p>
</div>
```
`updateMetrics`:
```js
const pc = result.patrimonioCompraFinal, pa = result.patrimonioArriendoFinal;
setText('v-compra', fmtCOP(pc));
setText('v-arr', fmtCOP(pa));
const total = pc + pa;
const pct = total > 0 ? (pc / total) * 100 : 50;
document.getElementById('v-bar-compra').style.width = pct + '%';
document.getElementById('v-bar-arr').style.width = (100 - pct) + '%';
const dif = result.diferencia, postTax = result.input.aplicarImpuestos !== false;
setText('v-result', `Gana ${dif >= 0 ? 'comprar' : 'arrendar'} por ${fmtCOP(Math.abs(dif))} ${postTax ? '(post-tax)' : '(bruto)'}`);
```
Remove the old `verdict.style.borderColor/background` green/coral block.

### CSS (verdict)
Neutral `.verdict` background/border. `.verdict__val` colored by scenario (teal/indigo). `.verdict__bar` a thin rounded bar; `--compra` teal, `--arr` indigo segments. Centered result line.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `styles/main.css` | Modified | All tokens (light + dark) + verdict styles |
| `index.html` | Modified | Verdict dual markup (replaces v-dif/v-sub) |
| `js/ui.js` | Modified | updateMetrics verdict block rewritten |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Contrast/legibility issues in dark or light | Med | Manual check both modes; Slate palette is high-contrast by design |
| Charts look off with new accents | Med | Visual smoke; tokens chosen so teal/indigo/orange/amber stay distinguishable |
| Verdict bar degenerate when a patrimonio is 0/negative | Low | Guard: total>0 else 50/50 |
| Old verdict IDs referenced elsewhere | Low | grep v-dif/v-sub; only updateMetrics used them |

## Rollback Plan

Revert the 3 files. Visual only.

## Success Criteria

- [ ] App renders in the Slate & Teal palette; switching OS light/dark shows both correctly.
- [ ] Charts re-color to the new accents (teal/indigo/orange/amber), legible in both modes.
- [ ] Verdict shows both patrimonios + proportional bar + "Gana X por $Y", neutral (no green/red good-bad).
- [ ] Both winners (compra / arriendo) look objective — only the bar proportion + text indicate the winner.
- [ ] `npm test` still 101 passing.
- [ ] No console errors; no leftover v-dif/v-sub references.
