# Tasks: docs-dual-mode-update

## Phase 1: README.md

- [x] 1.1 In the "Variables que considera" table, add 4 new rows after the existing "Retorno ETF en COP" row: "Aporte mensual al ETF" ($500k default, $0–$5M), "Aumento anual del aporte" (8% default, 0–20%), "Modo de inversión" (default "Aporte fijo", values: "Diferencia" / "Aporte fijo"), "Invertir cuota inicial al ETF" (default ON).
- [x] 1.2 Add a new H2 subsection "## Modos de inversión" between "Variables que considera" and "Outputs que produce". Two paragraphs: one for `Diferencia` (the academic model — invests `costoCompra - costoArriendo` when positive), one for `Aporte fijo` (the realistic model — fixed monthly commitment with annual step-up). One closing line: when each is most useful.

## Phase 2: docs/FORMULAS.md §5

- [x] 2.1 Rewrite the paragraph that describes "el aporte mensual" to describe BOTH branches: `diferencia` adds `max(0, costoCompra - costoArriendo)`; `aporte-fijo` adds the running monthly contribution.
- [x] 2.2 Add the step-up formula: at months 13, 25, 37, …, `aporteActual = aporteActual × (1 + aporteIncrementoPct / 100)`. One sentence explaining why (refleja ajuste salarial anual).
- [x] 2.3 Update the "aporte inicial" paragraph to mention the `invertirCashInicial` toggle: when off, the renter ETF starts at 0.

## Phase 3: Verification (manual)

- [x] 3.1 Read both edited files end-to-end. Confirm there is no contradiction with `openspec/specs/etf-investment-mode/spec.md` requirements.
- [x] 3.2 Confirm the 5 success criteria from `proposal.md` are satisfied.
