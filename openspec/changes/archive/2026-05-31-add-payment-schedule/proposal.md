# Proposal: Payment schedule (tabla de amortización)

## Intent

The user validated the calculator's cuota against the FNA and wants the month-by-month payment schedule to validate at the row level against any bank's plan. Add an amortization table (240 rows) showing how each payment breaks down — cuota, interés, capital, both insurances, the total with insurance, and the remaining balance — collapsible and exportable to CSV.

## Scope

### In Scope
- New pure function `Calculator.amortizationSchedule(input)` returning `plazoAnios × 12` rows: `{ mes, cuota, interes, capital, seguroVida, seguroIncendio, cuotaTotal, saldo }`. Only mortgage + insurance (what the bank shows; no ETF).
- Collapsible UI section ("Ver plan de pagos") with a scrollable table (8 columns) + an "Exportar CSV" button.
- Render only when the section is open (performance); CSV generated on demand.
- TDD strict for the schedule function.

### Out of Scope
- UVR amortization.
- Showing ETF contributions in this table (it's the mortgage plan, matching the bank).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — new derived function + UI. Tests carry the math.

## Approach

### Calc (`calculator.js`)
```js
function amortizationSchedule(input) {
  const { precio, cuotaInicialPct, tasaEA, plazoAnios,
          seguroVidaPct = 0.05, seguroIncendioPct = 0.045 } = input;
  const monto = precio - (precio * cuotaInicialPct / 100);
  const meses = plazoAnios * 12;
  const tasaMensual = eaToMonthly(tasaEA);
  const cuota = monthlyPayment(monto, tasaEA, plazoAnios);
  const seguroIncendioM = precio * seguroIncendioPct / 100; // fijo
  const rows = [];
  let saldo = monto;
  for (let m = 1; m <= meses; m++) {
    const interes = saldo * tasaMensual;
    const capital = cuota - interes;
    const seguroVida = saldo * seguroVidaPct / 100; // sobre saldo al inicio del mes
    const cuotaTotal = cuota + seguroVida + seguroIncendioM;
    saldo -= capital;
    rows.push({ mes: m, cuota, interes, capital, seguroVida,
                seguroIncendio: seguroIncendioM, cuotaTotal,
                saldo: Math.max(saldo, 0) });
  }
  return rows;
}
```
Consistent with `simulate()`: seguro vida on the month-start balance, incendio fixed on initial value, cuota via the French system.

### UI (`ui.js`)
- `renderAmortTable(schedule)` — builds the `<table>` rows into `#schedule-body`. Called only when the `<details>` is open.
- `exportScheduleCSV(schedule)` — builds CSV (headers + rows), triggers a download via Blob + anchor.
- Format COP as integers with thousands separators.

### Wiring (`app.js`)
- In `recalcular()`: if the schedule `<details>` is `[open]`, call `UI.renderAmortTable(Calculator.amortizationSchedule(inputs))`.
- Bind the `<details>` `toggle` event (render on open) and the CSV button click.

### HTML + CSS
- `<details class="schedule">` after the goal-seek section: `<summary>` "Ver plan de pagos", a CSV button, and a scrollable wrapper with the `<table>` (sticky header). 8 columns.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | amortizationSchedule + export + JSDoc |
| `js/ui.js` | Modified | renderAmortTable + exportScheduleCSV + exports |
| `js/app.js` | Modified | recalcular renders if open; bind toggle + CSV button |
| `index.html` | Modified | Collapsible schedule section + table skeleton + CSV button |
| `styles/main.css` | Modified | Scrollable table styles |
| `tests/schedule.test.js` | NEW | TDD |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 240-row render lags on slider drag | Med | Render only when open; table is plain DOM, ~240 rows is fine; if needed, debounce |
| Schedule math diverges from simulate's amortization | Low | Tests assert Σcapital = monto, Σinterés = totalIntereses, saldo final ≈ 0 |
| CSV encoding/locale issues | Low | Plain numbers, comma-separated, UTF-8 Blob |

## Rollback Plan

Revert the files, delete the test. Additive.

## Success Criteria

- [ ] `tests/schedule.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: all tests pass.
- [ ] `amortizationSchedule` returns plazoAnios×12 rows; Σcapital ≈ monto; Σinterés ≈ totalIntereses; saldo final ≈ 0.
- [ ] Each row: cuotaTotal === cuota + seguroVida + seguroIncendio.
- [ ] seguroVida decreases row 1 → last; seguroIncendio constant.
- [ ] Browser: "Ver plan de pagos" expands a scrollable 8-column table; "Exportar CSV" downloads a file that opens in Excel; numbers match the on-screen table.
- [ ] No console errors; no noticeable lag.
