/**
 * goal-seek.test.js
 * ================================================================
 * TDD: tests para goalSeek (bisección) y breakevens (palancas por modo).
 *
 * Invariante clave: para un umbral no-nulo, simulate justo arriba y justo
 * abajo del umbral da diferencia con SIGNOS OPUESTOS (cruce real).
 *
 * Las palancas dependen del modo: en 'diferencia' las 4 mueven el resultado;
 * en 'aporte-fijo' solo retornoEtf y apreciación (tasa/arriendo no afectan
 * el patrimonio final, solo el flujo de caja intermedio).
 * ================================================================
 */

import { describe, it, expect } from 'vitest';
import { simulate, goalSeek, breakevens } from '../js/calculator.js';

// Defaults en modo DIFERENCIA — ahí las 4 palancas cruzan (escenario parejo).
const defaults = {
  precio: 250e6,
  cuotaInicialPct: 10,
  escrituracionPct: 5.5,
  apreciacionPct: 4.5,
  tasaEA: 10,
  plazoAnios: 20,
  arriendoInicial: 1.6e6,
  ipcPct: 5,
  adminInicial: 380000,
  adminArriendoInicial: 190000,
  retornoEtfUsdPct: 8,
  modo: 'diferencia',
  aporteMensualUsd: 250,
  aporteIncrementoPct: 8,
  invertirCashInicial: true,
  tasaCopUsdInicial: 4200,
  devaluacionAnualPct: 3,
  aplicarImpuestos: true,
  tarifaRentaMarginal: 33,
  tarifaGananciaViviendaPct: 10,
  costoVentaViviendaPct: 5,
  viviendaPrimera: true,
  aporteAfcMensual: 0,
  salarioMensual: 5e6,
  crecimientoSalarialPct: 5
};

describe('breakevens — palancas por modo', () => {
  it("modo 'diferencia' devuelve 4 palancas con las keys correctas", () => {
    const r = breakevens(defaults);
    expect(r.length).toBe(4);
    expect(r.map((x) => x.key)).toEqual([
      'retornoEtfUsdPct', 'apreciacionPct', 'tasaEA', 'arriendoInicial'
    ]);
    for (const e of r) {
      expect(e.umbral === null || typeof e.umbral === 'number').toBe(true);
      expect(typeof e.actual).toBe('number');
    }
  });

  it("modo 'aporte-fijo' devuelve solo 2 palancas (retornoEtf, apreciación)", () => {
    const r = breakevens({ ...defaults, modo: 'aporte-fijo' });
    expect(r.map((x) => x.key)).toEqual(['retornoEtfUsdPct', 'apreciacionPct']);
  });
});

describe('goalSeek — real crossing', () => {
  it('todo umbral no-nulo es un cruce genuino (sign-flip de diferencia)', () => {
    const r = breakevens(defaults);
    const crossings = r.filter((x) => x.umbral !== null);
    expect(crossings.length).toBeGreaterThan(0); // en diferencia, varias cruzan

    for (const { key, umbral } of crossings) {
      const step = key === 'arriendoInicial' ? 50000 : 0.2;
      const below = simulate({ ...defaults, [key]: umbral - step }).diferencia;
      const above = simulate({ ...defaults, [key]: umbral + step }).diferencia;
      expect(Math.sign(below)).not.toBe(Math.sign(above));
    }
  });

  it('todo umbral no-nulo cae dentro del rango de su palanca', () => {
    const ranges = {
      retornoEtfUsdPct: [0, 18],
      apreciacionPct: [0, 10],
      tasaEA: [4, 18],
      arriendoInicial: [0.5e6, 6e6]
    };
    for (const e of breakevens(defaults)) {
      if (e.umbral !== null) {
        const [min, max] = ranges[e.key];
        expect(e.umbral).toBeGreaterThanOrEqual(min);
        expect(e.umbral).toBeLessThanOrEqual(max);
      }
    }
  });
});

describe('goalSeek — no crossing', () => {
  it('devuelve null cuando comprar gana tan fuerte que ni el ETF al 18% lo invierte', () => {
    const buyDominant = {
      ...defaults,
      modo: 'diferencia',
      apreciacionPct: 10,
      tasaEA: 4,
      arriendoInicial: 6e6,
      aporteMensualUsd: 0
    };
    const atMax = simulate({ ...buyDominant, retornoEtfUsdPct: 18 }).diferencia;
    expect(atMax).toBeGreaterThan(0); // comprar gana incluso al máximo retorno
    expect(goalSeek(buyDominant, 'retornoEtfUsdPct', 0, 18)).toBeNull();
  });
});
