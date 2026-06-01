# Proposal: Scenario presets

## Intent

The current "Configuración rápida" presets are per-lender (FNA, banca, VIS) and only set tasa + cuota inicial — leaving the scenario half-configured. Replace them with 5 scenario presets that set several coherent variables at once (and the mode, where relevant), fusing credit source + assumptions into ready-to-explore starting points.

## Scope

### In Scope
- Restructure `Calculator.PRESETS` to a richer format: each preset has a `label`, an optional `modo`, and a `sliders` map (sliderId → value).
- 5 presets (confirmed values):
  - **Joven FNA**: tasa 8.8, ci 10, plazo 30
  - **Banca tradicional**: tasa 12.5, ci 30, plazo 20
  - **VIS primera vivienda**: tasa 7.3, ci 0, precio 215, plazo 30
  - **Inversionista disciplinado**: modo 'aporte-fijo', aporte 400, incr 10, etf 9
  - **Conservador**: apr 3, etf 6, dev 2
- Generalize `UI.applyPreset` to apply any sliders + optional mode (instead of hardcoded tasa/ci/precio).
- Replace the 5 preset buttons in `index.html` with descriptive subtitles.
- Light TDD: structural test of `PRESETS`.

### Out of Scope
- Custom/saved presets (localStorage) — option D, separate change.
- Presets that toggle checkboxes (impuestos, vivienda primera, cashInicial).
- Updating rates to newer real values (would need real data).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — data + UI. Light test covers the PRESETS structure.

## Approach

### `PRESETS` (calculator.js)
```js
const PRESETS = {
  'joven-fna':     { label: 'Joven FNA',                sliders: { tasa: 8.8, ci: 10, plazo: 30 } },
  'banca':         { label: 'Banca tradicional',         sliders: { tasa: 12.5, ci: 30, plazo: 20 } },
  'vis':           { label: 'VIS primera vivienda',      sliders: { tasa: 7.3, ci: 0, precio: 215, plazo: 30 } },
  'inversionista': { label: 'Inversionista disciplinado', modo: 'aporte-fijo', sliders: { aporte: 400, incr: 10, etf: 9 } },
  'conservador':   { label: 'Conservador',               sliders: { apr: 3, etf: 6, dev: 2 } }
};
```

### `applyPreset` (ui.js)
```js
function applyPreset(name) {
  const preset = Calculator.PRESETS[name];
  if (!preset) return;
  if (preset.modo) setMode(preset.modo);
  if (preset.sliders) {
    Object.entries(preset.sliders).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
  }
  document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('is-active'));
  const active = document.querySelector(`.preset-btn[data-preset="${name}"]`);
  if (active) active.classList.add('is-active');
  refreshOutputs();
}
```
`app.js bindPresets` is unchanged (iterates `.preset-btn`, calls applyPreset + recalcular). When a preset sets the mode, setMode updates the panel `data-mode` so input visibility follows.

### HTML
5 buttons; each `preset-btn__rate` span becomes a short descriptor (e.g. "8.8% · 30 años", "$400 USD/mes", "supuestos cautos").

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/calculator.js` | Modified | PRESETS restructured |
| `js/ui.js` | Modified | applyPreset generalized (sliders + modo) |
| `index.html` | Modified | 5 scenario buttons with descriptors |
| `tests/presets.test.js` | NEW | Structural test |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PRESETS format change breaks applyPreset | Med | They change together; test asserts structure; manual browser check applies each preset |
| A preset references a non-existent slider id | Low | Test: every sliders key ∈ Object.keys(INPUT_CONFIG) |
| Mode-setting preset leaves input visibility stale | Low | setMode updates data-mode on panel; manual verify |

## Rollback Plan

Revert the 3 files, delete the test. The old PRESETS format is restorable.

## Success Criteria

- [ ] `tests/presets.test.js` written first, FAILS before implementation (RED).
- [ ] Post-implementation: all tests pass.
- [ ] PRESETS has 5 scenarios; every sliders key is a valid INPUT_CONFIG id; inversionista.modo === 'aporte-fijo'.
- [ ] Browser: clicking each preset sets the expected sliders; "Inversionista" also switches to aporte-fijo mode (inputs visibility follows); button highlights as active.
- [ ] No console errors.
