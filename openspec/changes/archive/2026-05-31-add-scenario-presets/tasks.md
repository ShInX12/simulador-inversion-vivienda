# Tasks: add-scenario-presets (light TDD — data + UI)

## Phase 1: Test FIRST (structural, RED)

- [x] 1.1 Create `tests/presets.test.js`. Import `PRESETS` from calculator.js and `INPUT_CONFIG` from ui.js (INPUT_CONFIG is a const, doesn't touch DOM at import).
- [x] 1.2 **5 scenarios with expected keys**: `Object.keys(PRESETS)` equals `['joven-fna','banca','vis','inversionista','conservador']`.
- [x] 1.3 **Each preset valid shape**: has a string `label`; has a non-empty `sliders` object OR a `modo`; if `modo` present it's 'diferencia' or 'aporte-fijo'.
- [x] 1.4 **Slider keys are real**: every key in each preset's `sliders` is in `Object.keys(INPUT_CONFIG)`.
- [x] 1.5 **Inversionista sets mode**: `PRESETS['inversionista'].modo === 'aporte-fijo'`.
- [x] 1.6 Run `npm test`. New tests FAIL (PRESETS still old format). Existing 83 PASS.

## Phase 2: Implementation in `js/calculator.js` (GREEN)

- [x] 2.1 Replace `PRESETS` with the new format (5 scenarios, label + optional modo + sliders map per the proposal).
- [x] 2.2 Run `npm test`. All pass.

## Phase 3: UI — `js/ui.js`

- [x] 3.1 Rewrite `applyPreset(name)`: read preset; if `preset.modo` call `setMode(preset.modo)`; iterate `preset.sliders` setting `document.getElementById(id).value` defensively (`if (el)`); update active button class; `refreshOutputs()`.

## Phase 4: HTML — `index.html`

- [x] 4.1 Replace the 5 (currently 4) preset buttons inside `.presets__grid` with the new scenarios. Each: `data-preset="<key>"`, `preset-btn__name` = label, `preset-btn__rate` = descriptor:
   - joven-fna → "Joven FNA" / "8.8% · 30 años"
   - banca → "Banca tradicional" / "12.5% · 30%"
   - vis → "VIS primera vivienda" / "7.3% · $215M"
   - inversionista → "Inversionista" / "$400 USD/mes"
   - conservador → "Conservador" / "supuestos cautos"

## Phase 5: Manual verification

- [x] 5.1 `npm test`: all green.
- [x] 5.2 Browser: 5 preset buttons in "Configuración rápida".
- [x] 5.3 Click "Joven FNA" → tasa 8.8, ci 10, plazo 30 set; outputs update; button active.
- [x] 5.4 Click "Banca tradicional" / "VIS primera vivienda" → their sliders set correctly (VIS also sets precio 215).
- [x] 5.5 Click "Inversionista disciplinado" → switches to "Aporte fijo" tab (inputs visibility follows), aporte $400, incremento 10%, retorno ETF 9%.
- [x] 5.6 Click "Conservador" → apreciación 3%, retorno ETF 6%, devaluación 2%.
- [x] 5.7 Editing a slider after applying a preset clears the active highlight (existing behavior).
- [x] 5.8 No console errors.
