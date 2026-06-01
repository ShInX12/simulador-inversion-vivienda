# Proposal: ETF dual-mode investment

## Intent

The calculator today models ETF investment with one strategy: invest the monthly difference between buying and renting. It is academically clean but assumes perfect financial discipline that real users do not have, and it produces $0 contributions in early years when renting is the more expensive choice.

Add a second, operationally realistic mode where the user commits to a fixed monthly contribution that grows annually. Keep both modes selectable so the user can compare the textbook upper bound against their actual savings plan.

## Scope

### In Scope
- New `modo` field on the input contract: `'diferencia' | 'aporte-fijo'`
- Two new inputs: `aporteMensual` (COP) and `aporteIncrementoPct` (%)
- New toggle: `invertirCashInicial` (boolean), applies to BOTH modes
- Mode selector UI: segmented tabs above the existing controls panel
- Conditional show/hide of inputs based on the selected mode
- Default mode: `aporte-fijo` (more realistic first impression)
- Default toggle: `invertirCashInicial = true` (matches current behavior)

### Out of Scope
- USD↔COP conversion (input is COP only)
- Modeling contributions in the buyer scenario (only renter invests)
- Persisting mode/inputs across reloads (future change)
- Taxes, maintenance, sale costs (separate future changes)

## Capabilities

### New Capabilities
- `etf-investment-mode`: defines the two strategies (`diferencia`, `aporte-fijo`), their input contracts, the `invertirCashInicial` toggle semantics, and the per-month ETF contribution rules in `simulate()`

### Modified Capabilities
- None — new capability layered on top of existing math; no existing spec is rewritten

## Approach

`calculator.js`: extend the input contract with `modo`, `aporteMensual`, `aporteIncrementoPct`, `invertirCashInicial`. Inside `simulate()`, branch the per-month ETF contribution: `diferencia` keeps current logic verbatim; `aporte-fijo` adds a fixed amount that steps up at month 13/25/37/… by `(1 + aporteIncrementoPct/100)`. The toggle gates whether `etf` initializes to `cashInicial` or `0`.

`ui.js`: add 3 entries to `INPUT_CONFIG`, extend `readInputs()`, drive show/hide via a `data-mode` attribute on the controls panel.

`index.html`: tab strip for mode + 2 new sliders + 1 toggle inside the "Inversión alternativa" group.

`app.js`: bind tab clicks and the toggle to `recalcular()`.

`styles/main.css`: minimal styling for tabs and the toggle.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | Input contract + branched ETF calc + cashInicial gate |
| `js/ui.js` | Modified | INPUT_CONFIG, readInputs, mode visibility |
| `js/charts.js` | None | Result object shape unchanged |
| `js/app.js` | Modified | Bind tabs + toggle |
| `index.html` | Modified | Tab strip + 2 sliders + 1 toggle |
| `styles/main.css` | Modified | Tab + toggle styling |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regression in `modo='diferencia'` math vs current behavior | Med | Keep that branch byte-equivalent to current code; verify against FORMULAS.md §10 |
| User confused about which mode answers which question | Med | Clear tab labels + one-line hint under the tab strip |
| `aporte-fijo` is treated as a commitment even when arriendo > cuota (low cash) | Low | Document in recommendation text; the user-chosen amount is intentional |

## Rollback Plan

Revert `js/calculator.js`, `js/ui.js`, `js/app.js`, `index.html`, `styles/main.css` to their pre-change contents. No data migration, no persistence, no schema. Single revert restores everything.

## Dependencies

None. All work is local to existing files. No new libraries, no CDN additions.

## Success Criteria

- [ ] With `modo='diferencia'` and default inputs, all 5 metrics produce IDENTICAL numbers to the pre-change baseline (regression check)
- [ ] With `modo='aporte-fijo'`, `aporteMensual=0`, `aporteIncrementoPct=0`, `invertirCashInicial=true` → ETF series equals pure compounding of `cashInicial`
- [ ] Switching tabs hides/shows the relevant inputs without scroll jumps or layout shift
- [ ] No console errors when dragging any slider in either mode
- [ ] Sanity values from FORMULAS.md §10 still pass under `modo='diferencia'`
