# Proposal: localStorage persistence

## Intent

The user configures the calculator to their real case (price, exact rate, their bank's insurance rates, salary) and loses it all on reload. Auto-save the configuration to `localStorage` so it persists across reloads, plus a "Restablecer valores" button to return to factory defaults.

## Scope

### In Scope
- `UI.saveState()` — serialize all controls (sliders from INPUT_CONFIG + 3 toggles + mode) to `localStorage['calc-state-v1']`. Called at the end of `recalcular()`.
- `UI.loadState()` — on load, restore each control from storage (defensively: only set controls that exist). Called in `init()` before the first `recalcular()`.
- `UI.resetState()` — clear storage + reload (returns to HTML defaults). Wired to a "Restablecer valores" button.
- All wrapped in `try/catch` (corrupt JSON, localStorage unavailable in private mode).
- Manual verification (no TDD strict — persistence + DOM, not math).

### Out of Scope
- Named custom presets (option b).
- Share-by-URL (option c).
- Cross-device sync (needs a backend).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — UI/persistence layer. The 101 existing tests remain the safety net (calculator.js untouched).

## Approach

### `ui.js`
```js
const STORAGE_KEY = 'calc-state-v1';

function saveState() {
  try {
    const sliders = {};
    Object.keys(INPUT_CONFIG).forEach((id) => {
      const el = document.getElementById(id);
      if (el) sliders[id] = el.value;
    });
    const toggles = {};
    ['cashtoggle', 'aplicarImpuestosToggle', 'viviendaPrimeraToggle'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) toggles[id] = el.checked;
    });
    const modeTabs = document.querySelector('.mode-tabs');
    const state = { v: 1, sliders, toggles, modo: modeTabs ? modeTabs.dataset.mode : undefined };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* localStorage no disponible — seguimos sin persistir */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.sliders) Object.entries(state.sliders).forEach(([id, v]) => {
      const el = document.getElementById(id); if (el) el.value = v;
    });
    if (state.toggles) Object.entries(state.toggles).forEach(([id, c]) => {
      const el = document.getElementById(id); if (el) el.checked = c;
    });
    if (state.modo) setMode(state.modo);
  } catch (e) { /* config corrupta — ignorar, usar defaults */ }
}

function resetState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  window.location.reload();
}
```

### `app.js`
- `recalcular()`: append `UI.saveState();` at the end.
- `init()`: call `UI.loadState();` after bindings, before `recalcular();`.
- `bindReset()`: button `#reset-btn` → `UI.resetState()`. Call in `init()`.

### HTML + CSS
- A "Restablecer valores" button at the end of the controls panel (after "Tu salario").
- Discreet full-width button styling.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/ui.js` | Modified | saveState/loadState/resetState + exports |
| `js/app.js` | Modified | loadState in init, saveState in recalcular, bindReset |
| `index.html` | Modified | Reset button |
| `styles/main.css` | Modified | Reset button style |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| localStorage unavailable (private mode) throws | Med | try/catch around all access; app works without persistence |
| Corrupt/old saved state breaks load | Med | try/catch + defensive set-only-if-exists; bad data → defaults |
| Stale field after app change | Low | loadState ignores unknown ids; missing ids keep HTML default; `v:1` allows future invalidation |
| saveState on every slider move costs | Low | Small object, synchronous setItem is fast; debounce only if needed |

## Rollback Plan

Revert the 4 files. No data migration; users can clear localStorage. Additive.

## Success Criteria

- [ ] Configure values, reload → values persist (not back to defaults).
- [ ] "Restablecer valores" → clears storage, returns to factory defaults.
- [ ] Private/incognito mode → app still works (no crash), just doesn't persist.
- [ ] Corrupt localStorage value → app loads defaults without error.
- [ ] `npm test` still 101 passing (calculator.js untouched).
- [ ] No console errors.
