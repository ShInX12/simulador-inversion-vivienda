# Proposal: Docs comprehensive update

## Intent

Four prior changes (`etf-usd-fx-model`, `add-vitest`, `add-tax-model`, `improve-crossover-metrics`) left documentation behind. README still describes a pre-USD pre-tax model; FORMULAS §5 still describes COP-only ETF math; ARCHITECTURE still says "no hay tests" when we have 58. Anyone (including future-you) reading the docs gets a misleading mental model.

Catch the docs up to the actual code state in one focused pass.

## Scope

### In Scope
- `README.md`:
  - "Variables que considera" table: add 6 tax inputs + 2 FX inputs; rename retornoEtf to USD; change aporte unit (COP → USD)
  - "Outputs que produce": add "ETF final (USD)" + "Cruce de patrimonio"; rename "Año del cruce" → "Año arriendo > cuota"; note that "Diferencia final" is post-tax by default
  - "Limitaciones conocidas": remove items now modeled (impuestos, AFC partial); refine remaining items
- `docs/FORMULAS.md`:
  - §5 (Interés compuesto del ETF): rewrite for USD/FX engine + branched contribution math
  - §10 sanity correction: $200M/8%EA/15y → $1,879,212 (was $1.86M, ~1% off)
  - NEW §11: FX rate engine (compounded monthly devaluation)
  - NEW §12: Tax model + AFC refund mechanic
- `docs/ARCHITECTURE.md`:
  - Replace "Por qué no hay tests" with "Tests" section (point to tests/, describe TDD workflow, mention 58 passing)
  - Update the result object shape diagram to include etfFinalUsdNeto, equityNeto, impuestos{}, crossoverPatrimonio
  - Mention the second capability `tax-and-exit-cost-model`

### Out of Scope
- `docs/EXTENDING.md` (defer; may need a follow-up if recipes go stale)
- Screenshots, diagrams, or visual additions
- License changes
- Translations or i18n

## Capabilities

### New Capabilities
None — docs change.

### Modified Capabilities
None — describing existing behavior, not changing it.

## Approach

Each file gets surgical edits scoped to outdated sections. Before each edit, cross-reference against the current implementation in `js/calculator.js`, `js/ui.js`, and the spec files at `openspec/specs/etf-investment-mode/spec.md` and `openspec/specs/tax-and-exit-cost-model/spec.md` to ensure the doc matches reality.

For numerical sanity values (FORMULAS §10 etc.), the test file `tests/calculator.test.js` is the authoritative source — assert what the tests assert.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `README.md` | Modified (3 sections) | Variables table, Outputs section, Limitaciones |
| `docs/FORMULAS.md` | Modified (§5 + §10) + NEW (§11 + §12) | ETF math + sanity fix + 2 new sections |
| `docs/ARCHITECTURE.md` | Modified | Tests section + result shape + capabilities mention |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Doc text contradicts code | Med | Cross-reference against simulate() and spec files before each edit |
| Doc text contradicts tests | Low | Test file is source of truth for sanity values |
| Missing one of the 4 source changes | Med | Iterate file by file with explicit checklist |
| Existing doc reader gets confused by version skew | Low | This change exists precisely to remove that confusion |

## Rollback Plan

Revert the 3 doc files. Zero blast radius — pure markdown.

## Dependencies

- Reading the current state of:
  - `js/calculator.js` (especially the simulate() destructuring + return object)
  - `openspec/specs/etf-investment-mode/spec.md`
  - `openspec/specs/tax-and-exit-cost-model/spec.md`
  - `tests/calculator.test.js` for sanity values

## Success Criteria

- [ ] README "Variables que considera" table reflects all 18 input fields currently in `INPUT_CONFIG` (+ the 2 toggles)
- [ ] README "Outputs que produce" lists 7 metrics (cuota, cash, intereses, ETF USD, año arriendo>cuota, cruce patrimonio, diferencia)
- [ ] FORMULAS §5 describes USD/FX-based ETF growth, not COP magic
- [ ] FORMULAS §10 sanity for $200M/8%/15y reads $1.879M (or $1,879,212)
- [ ] FORMULAS has new §11 (FX engine) and §12 (Tax + AFC)
- [ ] ARCHITECTURE no longer says "no hay tests"; has a Tests section
- [ ] After the doc updates, `npm test` still shows 58 passing (regression invariant — docs change shouldn't break code)
- [ ] No contradictions between docs and `openspec/specs/*/spec.md`
