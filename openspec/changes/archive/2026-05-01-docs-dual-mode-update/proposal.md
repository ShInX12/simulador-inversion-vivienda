# Proposal: Update docs to reflect ETF dual-mode

## Intent

The previous change (`etf-dual-mode`) introduced two new inputs, a toggle, and a mode selector to the calculator, but `README.md` and `docs/FORMULAS.md` still describe the old single-strategy model. Anyone reading the docs will get a misleading mental model and be confused by the UI.

Update the docs so they accurately reflect the current behavior. Pure markdown change — no code touched.

## Scope

### In Scope
- `README.md`: extend "Variables que considera" table with 4 new entries (aporte mensual, % incremento anual, modo, toggle cuota inicial). Add a brief "Modos de inversión" subsection describing both strategies and when each makes sense.
- `docs/FORMULAS.md` §5 (Interés compuesto del ETF): rewrite the per-month contribution paragraph to describe both branches; add the step-up formula; mention the `invertirCashInicial` toggle in the initial-investment paragraph.

### Out of Scope
- `docs/ARCHITECTURE.md` — still accurate; layers and result object are unchanged
- `docs/EXTENDING.md` — recipes still apply; adding a "how to add a new mode" recipe is a separate optional change
- Adding new sections that weren't requested (limitations, examples, screenshots)

## Capabilities

### New Capabilities
- None — this is pure documentation; no behavioral spec changes.

### Modified Capabilities
- None — `etf-investment-mode` spec is the source of truth and was already written. We are only catching up the human-facing prose.

## Approach

Two surgical Edit operations:
1. `README.md`: add table rows + insert new subsection right after the existing "Variables que considera" table.
2. `docs/FORMULAS.md` §5: rewrite the second and third paragraphs to describe both modes and the step-up.

Verify by reading the edited files end-to-end and cross-referencing against `openspec/specs/etf-investment-mode/spec.md`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `README.md` | Modified | Inputs table + new "Modos de inversión" subsection |
| `docs/FORMULAS.md` | Modified | §5 rewritten to cover both modes + step-up + toggle |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Doc text contradicts the spec | Low | Cross-reference the new text against `openspec/specs/etf-investment-mode/spec.md` before committing |
| Drift again after future code changes | Med | Out of scope — addressed by future "/sdd-new add-vitest" or by always pairing code changes with doc updates |

## Rollback Plan

Revert `README.md` and `docs/FORMULAS.md` to their pre-change contents. Zero blast radius — no code, no data.

## Dependencies

- `etf-dual-mode` archived spec at `openspec/specs/etf-investment-mode/spec.md` is the source of truth this change is catching up to.

## Success Criteria

- [ ] `README.md` "Variables que considera" table contains rows for the 4 new inputs/controls
- [ ] `README.md` has a "Modos de inversión" subsection explaining both strategies
- [ ] `docs/FORMULAS.md` §5 describes BOTH ETF contribution modes
- [ ] `docs/FORMULAS.md` §5 includes the step-up formula
- [ ] Doc text aligns with `openspec/specs/etf-investment-mode/spec.md` (no contradictions)
