# Proposal: Docs charts + fields update

## Intent

Since the last comprehensive docs pass, three changes added charts and fields (`add-spending-chart`, `add-contribution-chart`, `add-salary-burden-chart`) plus the sunk-cost rename. README still says "Más tres gráficos" (now 6), is missing the salary inputs, and FORMULAS doesn't document the new `yearly[]` fields. Catch the docs up.

## Scope

### In Scope
- `README.md`:
  - "Variables que considera": add a "Tu salario" group (salarioMensual, crecimientoSalarialPct)
  - "Outputs que produce": replace "Más tres gráficos" with the actual 6 charts; the metrics list is already current
- `docs/FORMULAS.md`:
  - Document the full `yearly[]` shape (note the new fields: gastoCompraSunkAcum, gastoArriendoAcum, aporteAnualUsd, cargaCompraPct, cargaArriendoPct, costoCompraMes, costoArriendoMes) — add a short §13 "Campos derivados de las gráficas"
- `docs/ARCHITECTURE.md`:
  - Update the result object shape to include the new yearly[] fields and the salary inputs note

### Out of Scope
- EXTENDING.md (recipes still valid)
- Re-explaining the tax/FX math (already in §11/§12)
- Any code/test change

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — docs only.

## Approach

Surgical edits. Cross-reference each doc claim against `js/calculator.js` (the simulate() return + yearly[] push), `js/ui.js` (INPUT_CONFIG), and `index.html` (the 6 `<figure>` blocks) before writing.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `README.md` | Modified | Salary variables group + 6-charts list |
| `docs/FORMULAS.md` | Modified | New §13 documenting yearly[] derived fields |
| `docs/ARCHITECTURE.md` | Modified | Result object shape + salary inputs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Doc contradicts code | Low | Cross-reference before each edit; npm test still green after (sanity) |
| Miss a chart or field | Low | Enumerate all 6 charts and all yearly[] fields explicitly from the source |

## Rollback Plan

Revert the 3 doc files. Pure markdown.

## Success Criteria

- [ ] README "Variables que considera" includes the salary group (2 inputs)
- [ ] README lists 6 charts, not 3
- [ ] FORMULAS documents all current yearly[] fields
- [ ] ARCHITECTURE result shape matches the actual simulate() return
- [ ] `npm test` still 72 passing (docs change shouldn't touch code)
- [ ] No contradictions vs code/specs
