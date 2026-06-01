# Tasks: add-localstorage-persistence (UI/persistence — manual verify)

## Phase 1: `js/ui.js` — save/load/reset

- [x] 1.1 Add `const STORAGE_KEY = 'calc-state-v1';` near the top of the module.
- [x] 1.2 Add `saveState()`: serialize sliders (Object.keys(INPUT_CONFIG) → value, only if element exists), toggles (cashtoggle, aplicarImpuestosToggle, viviendaPrimeraToggle → checked), and modo (from `.mode-tabs` dataset). Wrap in try/catch. `localStorage.setItem(STORAGE_KEY, JSON.stringify({ v:1, sliders, toggles, modo }))`.
- [x] 1.3 Add `loadState()`: read + JSON.parse; if present, set slider values, checkbox checked, and `setMode(modo)` — all defensive (only if element exists). try/catch (corrupt → ignore).
- [x] 1.4 Add `resetState()`: `localStorage.removeItem(STORAGE_KEY)` (try/catch) + `window.location.reload()`.
- [x] 1.5 Export `saveState`, `loadState`, `resetState`.

## Phase 2: `js/app.js` — wiring

- [x] 2.1 In `recalcular()`, append `UI.saveState();` at the end.
- [x] 2.2 In `init()`, call `UI.loadState();` after the binds (bindSliders/Presets/ModeTabs/Toggle/Schedule) and before `recalcular();` — so restored values flow into the first render.
- [x] 2.3 Add `bindReset()`: `document.getElementById('reset-btn')?.addEventListener('click', UI.resetState);`. Call `bindReset()` in `init()`.

## Phase 3: HTML + CSS

- [x] 3.1 In `index.html`, after the last control-group ("Tu salario") inside `.panel--controls`, add:
   ```html
   <button type="button" id="reset-btn" class="reset-btn">Restablecer valores</button>
   ```
- [x] 3.2 In `styles/main.css`, add `.reset-btn`: full-width, discreet (surface bg, rule border, muted text), margin-top, hover state. Small, secondary look — not a primary CTA.

## Phase 4: Manual verification

- [x] 4.1 `npm test`: still 101 passing.
- [x] 4.2 Browser: change several sliders/toggles/mode → reload (F5) → values persist (not defaults).
- [x] 4.3 Click "Restablecer valores" → page reloads to factory defaults (precio 250M, ci 20%, etc.); the saved state is cleared.
- [x] 4.4 Apply a preset, reload → the preset's values persist.
- [x] 4.5 Open in a private/incognito window → app loads and works (persistence may be unavailable, but no crash).
- [x] 4.6 (Optional) Manually corrupt the localStorage value in devtools → reload → app loads defaults without error.
- [x] 4.7 No console errors.
