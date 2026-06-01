# Proposal: Summary scorecard

## Intent

The 7 top metric cards were designed for the original simple question (buy vs rent+invest-the-difference). After layering on aporte-fijo mode, USD/FX, taxes, AFC, and salary, they mix flows, stocks, and timings without hierarchy, and "Diferencia final" silently changed meaning (now post-tax, mode-dependent). Replace them with a comparative scorecard that answers the core question head-on: side-by-side "what you end with and what you lose" for buying vs renting, with the verdict on top and supporting details below.

All data already exists in `result` except two derived final-patrimonio fields. This is primarily information-design + a small calc addition.

## Scope

### In Scope
- Add 2 derived fields to `result`: `patrimonioCompraFinal` and `patrimonioArriendoFinal` (COP, already net-of-tax per the `aplicarImpuestos` toggle). Invariant: `diferencia === patrimonioCompraFinal - patrimonioArriendoFinal`.
- Replace the `.metrics` block in `index.html` with:
  - **Verdict banner**: who wins and by how much (post-tax/bruto label per toggle)
  - **2-column scorecard** (Comprar | Arrendar+ETF), rows: Patrimonio final, Plata perdida, Entrada, Mensual inicial
  - **Details strip** (compact): Intereses totales, ETF final (USD), and the 3 crossovers (arriendo>cuota, patrimonio, gasto)
- Rewrite `updateMetrics()` in `ui.js` to populate the new structure.
- New CSS for the scorecard, verdict banner, and details strip.
- TDD strict for the 2 new fields.

### Out of Scope
- "Pesos de hoy" (present-value) — separate feature.
- Changing what counts as "Mensual" (uses cuota vs arriendo, the principal payment, per the approved mockup).
- Touching the charts.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — derived fields + UI redesign. Tests carry the new fields' contract.

## Approach

### Calc (in `simulate()`)
```js
const patrimonioCompraFinal   = aplicarImpuestos ? equityNeto : final.equity;
const patrimonioArriendoFinal = aplicarImpuestos ? etfFinalUsdNeto * tasaActual : final.etf;
// diferencia already equals the difference of these two — assert in tests.
```
Add both to the returned object.

### UI (`ui.js` updateMetrics)
Populate: verdict (from diferencia/gana + aplicarImpuestos label), scorecard cells (patrimonio, plata perdida from final.gastoCompraSunkAcum/gastoArriendoAcum, entrada from cashInicial/0, mensual from cuota/input.arriendoInicial), details strip (totalIntereses, etfFinalUsd, crossover/crossoverPatrimonio/spendingCrossoverYear). Reuse fmtCOP/fmtCOPCuota/fmtUSD.

### HTML + CSS
Replace `.metrics` markup. Verdict banner keeps the highlight-color treatment (green if compra wins, coral if arriendo). Scorecard is a 2-col grid; details strip is a thin row of small items below.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | 2 derived fields + JSDoc |
| `js/ui.js` | Modified | Rewrite updateMetrics |
| `index.html` | Modified | Replace .metrics block |
| `styles/main.css` | Modified | Scorecard + verdict + details styles |
| `tests/scorecard.test.js` | NEW | TDD for the 2 fields |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| updateMetrics references old IDs that no longer exist | Med | Rewrite it fully against the new markup; grep old IDs (m-cuota, m-cash, etc.) and confirm none orphaned |
| Verdict label wrong when arriendo wins | Low | Test/verify both signs of diferencia |
| Inconsistency between diferencia and the two patrimonio fields | Low | Consistency test asserts equality for both toggle states |
| Calculator tests break | None expected | They assert result fields/yearly, not DOM. Adding fields is additive |

## Rollback Plan

Revert the 4 files, delete the test. Additive (new fields) + replaceable (UI block).

## Success Criteria

- [ ] `tests/scorecard.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: all tests pass (75 existing + new).
- [ ] `patrimonioCompraFinal - patrimonioArriendoFinal === diferencia` for both toggle ON and OFF (consistency).
- [ ] Toggle ON: patrimonioCompraFinal === equityNeto; toggle OFF: === final.equity.
- [ ] Browser: scorecard shows both scenarios side by side, verdict on top with correct winner/color, details strip below with intereses + ETF USD + 3 crossovers.
- [ ] No orphaned references to old metric IDs.
