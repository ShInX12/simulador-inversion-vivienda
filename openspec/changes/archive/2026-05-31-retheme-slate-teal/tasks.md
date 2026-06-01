# Tasks: retheme-slate-teal + objective verdict (visual — manual verify)

## Phase 1: Re-theme tokens — `styles/main.css`

- [x] 1.1 Replace the `:root` color tokens (light) with the Slate & Teal palette:
   bg-page #f1f5f9, bg-surface #f8fafc, bg-surface-2 #e2e8f0, bg-card #ffffff;
   ink-primary #0f172a, ink-secondary #475569, ink-tertiary #94a3b8, ink-rule #e2e8f0;
   accent-green #0d9488, accent-green-soft #ccfbf1, accent-coral #f97316, accent-coral-soft #ffedd5,
   accent-navy #4f46e5, accent-amber #d97706, positive #0d9488, negative #f97316.
   (Keep token NAMES; only values change.)
- [x] 1.2 Replace the `@media (prefers-color-scheme: dark)` `:root` tokens with the dark Slate & Teal:
   bg-page #0f172a, bg-surface #1e293b, bg-surface-2 #334155, bg-card #1e293b;
   ink-primary #e2e8f0, ink-secondary #94a3b8, ink-tertiary #64748b, ink-rule #334155;
   accent-green #2dd4bf, accent-green-soft #134e4a, accent-coral #fb923c, accent-coral-soft #7c2d12,
   accent-navy #818cf8, accent-amber #fbbf24, positive #2dd4bf, negative #fb923c.

## Phase 2: Objective verdict — HTML + ui.js + CSS

- [x] 2.1 In `index.html`, replace the current `.verdict` block (v-dif / v-sub) with the dual markup: label, `.verdict__compare` (two `.verdict__side` with `#v-compra` / `#v-arr`), `.verdict__bar` (two segments `#v-bar-compra` / `#v-bar-arr`), and `.verdict__result` (`#v-result`).
- [x] 2.2 In `js/ui.js` `updateMetrics`, replace the verdict block: set `v-compra`/`v-arr` (fmtCOP of patrimonioCompraFinal/ArriendoFinal), compute bar widths (pc/(pc+pa); guard total>0 else 50/50), set `v-result` ("Gana X por $Y (post-tax/bruto)"). Remove the old `verdict.style.borderColor/background` conditional and the `v-dif`/`v-sub` references.
- [x] 2.3 grep for `v-dif`, `v-sub` in js/ — confirm none remain.
- [x] 2.4 In `styles/main.css`, rewrite `.verdict` styles: neutral bg (`--bg-surface-2`) + neutral border; `.verdict__compare` flex space-between; `.verdict__name` small muted; `.verdict__val` display font, `--compra` teal (`--accent-green`), `--arr` indigo (`--accent-navy`); `.verdict__bar` flex, height ~10px, rounded, overflow hidden, with a thin gap; `.verdict__bar-seg--compra` bg teal, `--arr` bg indigo; `.verdict__result` centered, display italic, ink-secondary.

## Phase 3: Manual verification

- [x] 3.1 `npm test`: passing (creció a 106 con el chart de interés compuesto).
- [x] 3.2 Browser (OS light mode): app in Slate & Teal; verdict shows two patrimonios + bar + "Gana X por $Y"; charts legible. (Usuario: "me gusta mucho el tema claro".)
- [x] 3.3 Switch OS to dark mode → reload: dark palette renders; everything legible; charts re-colored.
- [x] 3.4 Make arriendo win → verdict stays neutral; bar leans to arrendar; no red/negative coloring.
- [x] 3.5 Make compra win → bar leans to comprar.
- [x] 3.6 Other charts/sections read well in the new palette.
- [x] 3.7 No console errors.

## Phase 4: Follow-ups visuales surgidos en la misma sesión (verificados por el usuario)

- [x] 4.1 Dark mode → gris NEUTRO (sin tinte azulado/morado) y más oscuro (bg #0a0a0a). Acentos intactos.
- [x] 4.2 Convención de color en charts: comprar=verde(teal), invertir/arrendar=morado(índigo). Aplicada a cRent, cGasto, cCarga, cAporte; swatches alineados; regla `.swatch--navy.swatch--dashed` agregada. (Memoria: design/color-convention.)
- [x] 4.3 `color-scheme: light/dark` en :root → scrollbars y controles nativos matchean el tema (cross-browser).
- [x] 4.4 Quitado el preset "VIS primera vivienda" (calculator.js PRESETS, botón en index.html, presets.test.js → 4 keys).
- [x] 4.5 Nuevo gráfico "Interés compuesto generado por el ETF (USD)" debajo de cAporte: 2 líneas (etfValorUsd con interés vs aportadoAcumUsd sin interés) + fill de la brecha. TDD: compound-interest.test.js (5 tests). (Memoria: finance/etf-compounding-model — modelo DCA mensual validado vs investor.gov.)
