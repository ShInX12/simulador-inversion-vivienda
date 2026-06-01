/**
 * contribution.test.js
 * ================================================================
 * TDD: tests para el aporte anual al ETF (aporteAnualUsd en yearly[]).
 * Deben FALLAR antes de la implementación (red phase).
 *
 * Solo cuenta aportes mensuales — NO el refund AFC ni el seed inicial.
 * ================================================================
 */

import { describe, it, expect } from 'vitest';
import { simulate } from '../js/calculator.js';

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
  retornoEtfUsdPct: 8,
  modo: 'aporte-fijo',
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
  aporteAfcMensual: 0
};

describe('Annual ETF contribution tracking', () => {
  it('Each yearly[] entry has a numeric aporteAnualUsd', () => {
    const r = simulate(defaults);
    for (const y of r.yearly) {
      expect(typeof y.aporteAnualUsd).toBe('number');
      expect(Number.isFinite(y.aporteAnualUsd)).toBe(true);
    }
  });

  it('aporte-fijo exact values: year 0 = 0, year 1 = 3000, year 2 = 3240, year 3 = 3499.2', () => {
    const r = simulate({ ...defaults, modo: 'aporte-fijo', aporteMensualUsd: 250, aporteIncrementoPct: 8 });
    expect(r.yearly[0].aporteAnualUsd).toBe(0);            // año 0, sin meses procesados
    expect(r.yearly[1].aporteAnualUsd).toBeCloseTo(3000, 6);   // 12 × 250
    expect(r.yearly[2].aporteAnualUsd).toBeCloseTo(3240, 6);   // 12 × 270 (250 × 1.08)
    expect(r.yearly[3].aporteAnualUsd).toBeCloseTo(3499.2, 4); // 12 × 291.6 (270 × 1.08)
  });

  it('AFC refund is NOT counted in aporteAnualUsd', () => {
    const base = simulate({ ...defaults, aporteAfcMensual: 0 });
    const withAfc = simulate({ ...defaults, aporteAfcMensual: 1_000_000 });
    // El refund AFC va al ETF pero NO al aporteAnualUsd → ambos deben ser idénticos
    for (let i = 0; i < base.yearly.length; i++) {
      expect(withAfc.yearly[i].aporteAnualUsd).toBeCloseTo(base.yearly[i].aporteAnualUsd, 6);
    }
  });

  it('diferencia mode produces non-negative annual contributions', () => {
    const r = simulate({ ...defaults, modo: 'diferencia' });
    for (const y of r.yearly) {
      expect(y.aporteAnualUsd).toBeGreaterThanOrEqual(0);
    }
  });
});
