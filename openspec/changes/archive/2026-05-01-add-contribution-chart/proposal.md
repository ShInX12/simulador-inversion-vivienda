# Proposal: Add annual ETF contribution chart

## Intent

The user can see the ETF's final value and growth, but not **how much they contribute to it each year**. In `aporte-fijo` mode, the annual contribution steps up each year (aporteIncrementoPct); in `diferencia` mode, it varies as the buy-vs-rent monthly gap changes with IPC. A bar chart of annual contributions makes the savings commitment tangible and shows the step-up / variation clearly.

## Scope

### In Scope
- Track `aporteAnualUsd` in `simulate()`: the sum of monthly ETF contributions (in USD) within each year. Reset per year.
- Add `aporteAnualUsd` to each `yearly[]` snapshot (year 0 = 0, no months processed).
- Counts ONLY monthly contributions: `aporte-fijo` → `aporteActualUsd` per month; `diferencia` → `max(0, costoCompra-costoArriendo)/tasa_m` per month. Does NOT include the AFC refund or the initial cashInicial seed.
- New bar chart `cAporte` in `charts.js`: single dataset, years 1-20, USD on Y-axis.
- New `<figure>` in `index.html` with canvas `cAporte`.
- TDD strict: 4 tests in `tests/contribution.test.js` written FIRST.

### Out of Scope
- Including AFC refund or initial seed in the chart (user doesn't use AFC; seed is one-time and would distort).
- COP version or a currency toggle.
- README/FORMULAS updates (defer to docs follow-up).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — observable extension. Tests carry the contract.

## Approach

### Math (in `simulate()`)
```js
let aporteAnualUsd = 0;

// Inside the contribution branch (where etfUsd is incremented):
//   diferencia: const aporteUsd = dif / tasaActual; etfUsd += aporteUsd; aportadoTotalUsd += aporteUsd; aporteAnualUsd += aporteUsd;
//   aporte-fijo: etfUsd += aporteActualUsd; aportadoTotalUsd += aporteActualUsd; aporteAnualUsd += aporteActualUsd;

// In the year-end snapshot push, include aporteAnualUsd, then reset:
//   yearly.push({ ..., aporteAnualUsd });
//   aporteAnualUsd = 0;
```

The AFC refund (year-end) is intentionally NOT added to `aporteAnualUsd` — it stays in its own logic and only affects `etfUsd`/`aportadoTotalUsd`.

### Chart (in `charts.js`)
New `cAporte` bar chart, mirroring the `amortChart` pattern: filter `anio > 0`, single dataset 'Aporte anual al ETF (USD)', Y-axis ticks `'$' + v`. Tooltip shows USD.

### HTML
New `<figure>` after the `cGasto` chart, before the recommendation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | aporteAnualUsd tracking + yearly field + JSDoc |
| `js/charts.js` | Modified | cAporte bar chart init + updateAll |
| `index.html` | Modified | New figure with canvas cAporte |
| `tests/contribution.test.js` | NEW | 4 tests TDD-first |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Year boundary off-by-one (which months count for year N) | Med | Test asserts exact values (year 1 = 3000, year 2 = 3240 with defaults); reset happens exactly at snapshot |
| Accidentally including AFC refund | Low | Refund logic is separate; aporteAnualUsd only incremented in the monthly branch. Test with AFC>0 confirms no change |
| Y-axis unit confusion (USD not millions) | Low | Tooltip + axis labeled clearly in USD |

## Rollback Plan

Revert the 3 files, delete `tests/contribution.test.js`. Additive.

## Success Criteria

- [ ] `tests/contribution.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: 63 + 4 = 67 tests passing.
- [ ] `aporte-fijo`, aporte=$250, incr=8%: yearly[1].aporteAnualUsd === 3000; yearly[2] === 3240 (12 × 270).
- [ ] yearly[0].aporteAnualUsd === 0.
- [ ] With aporteAfcMensual > 0, aporteAnualUsd is UNCHANGED vs aporteAfcMensual=0 (AFC not counted).
- [ ] Browser: bar chart "Aporte anual al ETF" visible, showing stepped bars in aporte-fijo mode and variable bars in diferencia mode.
