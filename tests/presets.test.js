/**
 * presets.test.js
 * ================================================================
 * TDD ligero: valida la ESTRUCTURA de los presets de escenario.
 * (El comportamiento — que clickear setea sliders — es UI/DOM, se
 * verifica manualmente; acá blindamos la data: keys válidas, modo válido.)
 * ================================================================
 */

import { describe, it, expect } from 'vitest';
import { PRESETS } from '../js/calculator.js';
import { INPUT_CONFIG } from '../js/ui.js';

const EXPECTED = ['joven-fna', 'banca', 'inversionista', 'conservador'];
const VALID_MODES = ['diferencia', 'aporte-fijo'];

describe('Scenario presets — structure', () => {
  it('PRESETS has the 4 expected scenario keys', () => {
    expect(Object.keys(PRESETS)).toEqual(EXPECTED);
  });

  it('each preset has a string label and either a non-empty sliders map or a modo', () => {
    for (const key of EXPECTED) {
      const p = PRESETS[key];
      expect(typeof p.label).toBe('string');
      expect(p.label.length).toBeGreaterThan(0);
      const hasSliders = p.sliders && Object.keys(p.sliders).length > 0;
      const hasModo = typeof p.modo === 'string';
      expect(hasSliders || hasModo).toBe(true);
    }
  });

  it("if a preset declares modo, it's a valid mode", () => {
    for (const key of EXPECTED) {
      const p = PRESETS[key];
      if (p.modo !== undefined) {
        expect(VALID_MODES).toContain(p.modo);
      }
    }
  });

  it('every sliders key references a real input (exists in INPUT_CONFIG)', () => {
    const validIds = Object.keys(INPUT_CONFIG);
    for (const key of EXPECTED) {
      const sliders = PRESETS[key].sliders || {};
      for (const id of Object.keys(sliders)) {
        expect(validIds).toContain(id);
        expect(typeof sliders[id]).toBe('number');
      }
    }
  });

  it("Inversionista disciplinado sets aporte-fijo mode", () => {
    expect(PRESETS['inversionista'].modo).toBe('aporte-fijo');
  });
});
