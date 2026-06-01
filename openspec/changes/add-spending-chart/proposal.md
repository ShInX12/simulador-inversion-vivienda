# Proposal: Add cumulative spending chart

## Intent

The user can currently see monthly costs (chart `cRent`) and total wealth (chart `cMain`), but not **how much they've actually spent over time** in each scenario. The buyer's spending starts high (cashInicial day zero) and grows slowly (cuota fixed + admin growing); the renter's spending starts at zero and grows exponentially (arriendo + adminArriendo, both with IPC). They eventually cross — at some year, the renter has spent more in total than the buyer.

This change adds a 4th chart that visualizes accumulated spending and the spending crossover, plus a visual marker (vertical dashed line) at that crossover year.

## Scope

### In Scope
- In `simulate()`, track `gastoCompraAcum` (running total) and `gastoArriendoAcum`. Buyer's accumulator seeds with `cashInicial`; renter's seeds at 0.
- Add `gastoCompraAcum` and `gastoArriendoAcum` to each `yearly[]` snapshot (in COP).
- Detect `spendingCrossoverYear` post-loop (first year where sign of `gastoCompraAcum - gastoArriendoAcum` flips).
- Add `spendingCrossoverYear` to the result object.
- Custom Chart.js plugin (~25 lines, inline in `charts.js`) named `verticalLine` that draws a vertical dashed line at a given year on a chart's canvas using the `afterDraw` hook.
- New chart `cGasto` in `charts.js`: line chart with two datasets (Comprar acumulado, Arrendar acumulado), uses `verticalLine` plugin with the `spendingCrossoverYear` to draw the marker.
- New `<figure>` in `index.html` with canvas `id="cGasto"`, placed after the existing `chart-row`.
- TDD strict: 4 tests in `tests/spending.test.js` written FIRST.

### Out of Scope
- Adding `spendingCrossoverYear` as a visible UI metric (the chart visualizes it; metric would be redundant).
- chartjs-plugin-annotation CDN dependency (custom inline plugin keeps zero new deps).
- Tooltip enhancements beyond the existing pattern.
- `docs/FORMULAS.md` and `README.md` updates (defer to a small docs follow-up).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — observable extension. Tests carry the contract.

## Approach

### Math (in `simulate()`)
```js
let gastoCompraAcum = cashInicial;  // upfront cost al mes 0
let gastoArriendoAcum = 0;

// Inside loop, BEFORE IPC bumps (use pre-bump values, consistent with cost crossover):
gastoCompraAcum += cuota + admin;
gastoArriendoAcum += arriendo + adminArriendo;

// Anual snapshot includes these.
// Post-loop:
let spendingCrossoverYear = null;
for (let i = 1; i < yearly.length; i++) {
  const prevSign = Math.sign(yearly[i-1].gastoCompraAcum - yearly[i-1].gastoArriendoAcum);
  const currSign = Math.sign(yearly[i].gastoCompraAcum - yearly[i].gastoArriendoAcum);
  if (prevSign !== currSign && prevSign !== 0 && currSign !== 0) {
    spendingCrossoverYear = yearly[i].anio;
    break;
  }
}
```

### Custom plugin (in `charts.js`)
```js
const verticalLinePlugin = {
  id: 'verticalLine',
  afterDraw(chart, args, options) {
    const year = options.crossoverYear;
    if (!year) return;
    const xPx = chart.scales.x.getPixelForValue(year);
    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPx, chart.scales.y.top);
    ctx.lineTo(xPx, chart.scales.y.bottom);
    ctx.strokeStyle = options.color || '#888';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    if (options.label) {
      ctx.fillStyle = options.color || '#888';
      ctx.font = '11px sans-serif';
      ctx.fillText(options.label, xPx + 4, chart.scales.y.top + 12);
    }
    ctx.restore();
  }
};
Chart.register(verticalLinePlugin);
```

`updateAll()` updates `chart.options.plugins.verticalLine.crossoverYear = result.spendingCrossoverYear` before each `update('none')`.

### HTML
New `<figure class="chart-figure">` with `<canvas id="cGasto">` placed after the existing `chart-row` and before the `recommendation`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | 2 new fields in yearly[]; spendingCrossoverYear post-loop; JSDoc |
| `js/charts.js` | Modified | verticalLine plugin + cGasto chart init + updateAll |
| `index.html` | Modified | New `<figure>` with canvas cGasto |
| `tests/spending.test.js` | NEW | 4 tests TDD-first |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Chart.js plugin API misuse (afterDraw signature, scale access) | Low | Plugin is ~25 lines and pattern is standard; visual smoke test catches issues immediately |
| Off-by-one in accumulation timing (pre-bump vs post-bump) | Med | Use pre-bump values (consistent with cost crossover detection); test asserts year-over-year monotonic increase |
| Chart layout breaks on smaller screens | Low | Single full-width chart row; existing CSS handles it |
| Spending crossover never happens in some scenarios | Low | Plugin checks `if (!year) return` — gracefully no marker drawn |

## Rollback Plan

Revert `js/calculator.js`, `js/charts.js`, `index.html`. Delete `tests/spending.test.js`. Additive change.

## Success Criteria

- [ ] `tests/spending.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: 58 + 4 = 62 tests passing.
- [ ] Browser: 4th chart visible below existing chart-row, full-width, with two lines + dashed vertical marker at crossover year (if exists).
- [ ] `gastoCompraAcum` and `gastoArriendoAcum` are monotonically increasing year over year (no decrease ever).
- [ ] With defaults, `gastoCompraAcum[0]` ≈ `cashInicial`; `gastoArriendoAcum[0]` = 0.
- [ ] Visually, where the lines cross matches the dashed marker year (within 1y tolerance for snapshots).
