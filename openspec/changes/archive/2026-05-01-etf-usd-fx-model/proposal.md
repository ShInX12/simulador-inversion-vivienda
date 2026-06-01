# Proposal: ETF USD/FX model

## Intent

The current calculator pretends the ETF returns "10% in COP" via a single magic number. In reality the ETF (CSPX.L and equivalents) is denominated in USD; the COP-equivalent return is a compound of two distinct phenomena: the ETF's USD return and the COP/USD devaluation. Hiding these inside one slider is convenient but misleading — it obscures the very reason a Colombian investor would put money in CSPX in the first place (FX hedging).

Refactor the ETF math to live in USD internally, expose the FX dynamics explicitly, and let the user contribute in USD (which matches how serious off-shore investors think about their commitment).

## Scope

### In Scope
- Refactor `simulate()` to maintain the renter's ETF balance in USD throughout
- Add `tasaCopUsdInicial` (initial COP/USD rate) and `devaluacionAnualPct` (annual peso devaluation, compounded monthly)
- Rename `retornoEtfPct` → `retornoEtfUsdPct` and shift its default 10% → 8% (now means USD nominal return)
- Replace the "Aporte mensual al ETF" slider unit COP → USD, default $250 USD/mo
- `aporteIncrementoPct` now multiplies the USD amount on the annual step-up
- `invertirCashInicial` toggle: when ON, `cashInicial` (COP) is converted to USD at month-0 rate
- Diferencia mode unchanged for the user; internally the COP difference is converted to USD at the current month's rate before entering the ETF
- New metric "ETF final en USD" displayed alongside existing metrics
- Main chart stays in COP (consistency with vivienda equity); ETF series is `etfUsd × tasa_m` per year

### Out of Scope
- Updating `README.md` and `docs/FORMULAS.md` — separate follow-up change (same pattern as `docs-dual-mode-update`)
- Stochastic FX modeling / Monte Carlo / volatility — fundamentally different tool, not this change
- Multiple currency support — this is COP/USD only
- Persistence of the new inputs in localStorage

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `etf-investment-mode`: significant behavioral change — the ETF balance is now USD-denominated, contributions flow through FX conversion, and the cashInicial toggle now triggers a month-0 conversion. Affects 4 of the 5 existing requirements (Investment Mode Selection unchanged; Diferencia, Aporte Fijo, Cash Investment Toggle modified; Backward Compatibility removed).

## Approach

### FX engine
At each month `m`, `tasa_m = tasaCopUsdInicial × (1 + devaluacionMensual)^m`, where `devaluacionMensual = (1 + devaluacionAnualPct/100)^(1/12) − 1`. This compounds monthly to match the apreciación and IPC patterns already in the calculator.

### Contribution flow
- `aporte-fijo` mode: `aporteUsd = aporteActualUsd` (user-set, with annual step-up applied to USD).
- `diferencia` mode: `aporteUsd = max(0, costoCompra − costoArriendo) / tasa_m` (COP difference converted at the month's rate).
- `etfUsd += aporteUsd; etfUsd *= 1 + retornoEtfUsdMensual`.

### Display
- `yearly[a].etf` carries the ETF value in COP (= `etfUsd × tasa_{m=12a}`) so the chart and downstream code see no shape change.
- `result.etfFinalUsd` is added to the result object for the new metric.

### Default behavior change
With new defaults (USD return 8% + devaluation 3%), the COP-equivalent compound rate is `(1.08)(1.03) − 1 ≈ 11.24%`, slightly higher than the old 10% magic number. This is acknowledged and documented; the old behavior was untrue anyway.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | FX engine + USD-denominated ETF + branched contribution + result object adds `etfFinalUsd` |
| `js/ui.js` | Modified | New `fmtUSD` formatter; INPUT_CONFIG adds `fx`/`dev` units; readInputs adds the 3 new fields; setMode, INPUT_CONFIG entries for `aporte` change unit USD |
| `index.html` | Modified | 2 new sliders (`tasaCopUsdInicial`, `devaluacionAnualPct`); `aporte` slider label/range/default updated; new metric card "ETF final en USD" |
| `js/app.js` | Likely none | Sliders auto-bind via INPUT_CONFIG |
| `js/charts.js` | None | Chart still consumes `result.yearly[].etf` (in COP); shape preserved |
| `styles/main.css` | None expected | Reuses existing slider/metric styles |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaks the previous regression invariant (default modo='diferencia' matched pre-etf-dual-mode numbers) | High | Acknowledge: that invariant is gone. Replace with new internal-consistency invariants (devaluacion=0 yields constant FX, aporte=0 yields pure compounding of cashInicial, etc.) |
| Mental model confusion: users used to "10% COP" need to rethink in 8% USD + 3% devaluation | Med | Subsection in README (next change) explaining the decomposition; the "Lectura del escenario" recommendation can mention it |
| Off-by-one in the FX-rate-at-month indexing (mes 0 vs mes 1, year-end mes 12 vs 13) | Med | Explicit scenario in spec for "tasa al mes 0" and "tasa al fin del año 1" |
| Breaks `aporte-fijo` slider for users with old habits | Low | Default $250 USD is in the same order of magnitude as the old $500k COP at typical FX; document the unit change in label hint |

## Rollback Plan

Revert `js/calculator.js`, `js/ui.js`, `index.html`. The change is contained to those 3 files plus a tiny one-liner in result for the new metric. No persisted data, no schema, no external dependencies.

## Dependencies

- Existing `etf-investment-mode` capability spec at `openspec/specs/etf-investment-mode/spec.md` — this proposal modifies it via delta spec.

## Success Criteria

- [ ] With `aporteMensualUsd=0`, `aporteIncrementoPct=0`, `devaluacionAnualPct=0`, `invertirCashInicial=true` → ETF in USD = `cashInicial / tasaInicial × (1 + retornoEtfUsdMensual)^240`. Pure compounding of converted lump sum.
- [ ] With `devaluacionAnualPct=0` and constant FX, `tasa_m === tasaCopUsdInicial` for every `m`.
- [ ] In `aporte-fijo` mode with `aporteMensualUsd=$250`, the ETF gains $250 USD before the monthly return at every month from 1 to 12; gains `$250 × (1 + aporteIncrementoPct/100)` from month 13 to 24; etc.
- [ ] In `diferencia` mode, when `costoCompra − costoArriendo = $700,000 COP` and `tasa_m = $4,200`, the ETF gains `166.67 USD` that month (= 700_000 / 4_200).
- [ ] New metric "ETF final en USD" appears alongside existing 5 metrics; value matches `etfUsd` at month 240.
- [ ] Switching modes recomputes correctly without console errors.
- [ ] No existing chart breaks (result object shape preserved at the COP boundary).
