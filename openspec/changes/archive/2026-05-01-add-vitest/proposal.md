# Proposal: Add Vitest + ESM migration

## Intent

The project has zero automated test coverage by deliberate design. Three changes in, the cost-crossover chart inconsistency bug exposed the limits of manual verification: the metric and the chart used different cost definitions and only eyeballing caught it. The user has approved adding deps. This change adds Vitest as the test runner and migrates the IIFE/`window` module pattern to native ES Modules so tests can `import` the modules. The output is a regression-safety harness for every future change.

## Scope

### In Scope
- Add `package.json` with `vitest` as dev dependency; `npm test` script
- Add minimal `vitest.config.js` (Node environment, no DOM yet)
- Migrate `js/calculator.js`, `js/ui.js`, `js/charts.js`, `js/app.js` from IIFE/`window` to native ESM (`export` / `import`)
- Update `index.html` to a single `<script type="module" src="js/app.js">`
- Create `tests/`:
  - `calculator.test.js` — covers the 14 spec scenarios from `etf-investment-mode` plus `eaToMonthly`, `monthlyPayment`, `totalInterest`, and `docs/FORMULAS.md §10` sanity values
  - `formatters.test.js` — `fmtCOP`, `fmtCOPCuota`, `fmtPct`, `fmtUSD` (edge cases included)
  - `crossover-bug.test.js` — a test that FAILS initially, capturing the cost-crossover chart bug; the fix is the next change
- Add `.gitignore` for `node_modules/`
- Update `README.md` with a "Cómo correr los tests" section

### Out of Scope
- happy-dom + DOM-touching tests (separate change if/when needed)
- TypeScript migration
- Chart.js npm migration (stays on CDN)
- CI/CD pipeline
- Playwright / E2E
- Fixing the cost-crossover bug (next change, post-tests, red→green)

## Capabilities

### New Capabilities
None — this is tooling/infrastructure, not behavior.

### Modified Capabilities
None.

## Approach

ESM migration is mechanical: remove `(function (global) {...})(global)` wrappers, prefix public functions with `export`, replace `window.X.foo()` calls with imports. Inter-module deps post-migration:
- `calculator.js` → no imports (leaf)
- `ui.js` → imports from `calculator.js` (PRESETS, generarRecomendacion)
- `charts.js` → uses global `Chart` from CDN (no JS imports)
- `app.js` → imports from all three (entry point)

Vitest config: 10-line file, `environment: 'node'`, `include: ['tests/**/*.test.js']`. Tests written against the spec's Given/When/Then scenarios.

Browser preservation: app must work identically after migration. `file://` may be strict with `<script type="module">` — README already recommends `python3 -m http.server`; this change documents it as the supported way to run.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json`, `vitest.config.js`, `.gitignore` | NEW | Tooling |
| `tests/*.test.js` | NEW (3 files) | ~40+ tests |
| `js/calculator.js`, `js/ui.js`, `js/charts.js`, `js/app.js` | Modified | IIFE → ESM |
| `index.html` | Modified | Single `<script type="module">` |
| `README.md` | Modified | "Cómo correr los tests" section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Subtle bug introduced by IIFE→ESM migration | Med | The tests themselves validate; if all pass, modules load correctly |
| `file://` blocks ES modules in some browsers | High | Document the served-via-HTTP requirement explicitly |
| Missed `window.X` reference somewhere | Low | API surfaces are small and well-scoped; grep before commit |
| `crossover-bug.test.js` accidentally passes (no bug) | Low | Confirms either the bug is fixed or our diagnostic was wrong — informative either way |

## Rollback Plan

Revert the 4 JS files and `index.html` to pre-change content. Delete `package.json`, `vitest.config.js`, `tests/`, `node_modules/`. The change is self-contained — single revert restores original state.

## Dependencies

- Node.js installed locally (user accepted)
- npm (built into Node)

## Success Criteria

- [ ] `npm install` succeeds
- [ ] `npm test` runs ~40+ tests; ALL except `crossover-bug.test.js` pass
- [ ] `crossover-bug.test.js` FAILS (red), capturing the unresolved bug for the next change
- [ ] App runs identically in browser via `python3 -m http.server 8080`: all sliders, both modes, both toggles, no console errors, same numbers as before the migration
- [ ] All 14 spec scenarios from `etf-investment-mode` are covered by passing tests
- [ ] FORMULAS.md §10 sanity values pass (cuota of $100M / 10% / 20y ≈ $937k)
