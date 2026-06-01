/**
 * crossover-metrics.test.js
 * ================================================================
 * TDD: tests escritos antes de la implementación de result.crossoverPatrimonio.
 * Deben FALLAR en la primera corrida (red phase). Phase 2 los lleva a verde.
 *
 * Capability: improve-crossover-metrics
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

describe('crossoverPatrimonio: detection of first equity-vs-etf sign flip', () => {
  it('Default scenario: result.crossoverPatrimonio is either null or a finite year between 1 and 20', () => {
    const r = simulate(defaults);
    const isValid =
      r.crossoverPatrimonio === null ||
      (typeof r.crossoverPatrimonio === 'number' &&
        r.crossoverPatrimonio >= 1 &&
        r.crossoverPatrimonio <= 20);
    expect(isValid).toBe(true);
  });

  it('Extreme ETF dominance (retornoEtfUsdPct=30): equity never catches up → crossoverPatrimonio === null', () => {
    const r = simulate({
      ...defaults,
      retornoEtfUsdPct: 30,
      aplicarImpuestos: false // no taxes complicate the comparison
    });
    // With 30% USD return + 3% devaluation, ETF dwarfs equity at every year.
    expect(r.crossoverPatrimonio).toBeNull();
  });

  it('When crossover exists, it is the FIRST sign flip (no earlier year has flipped)', () => {
    const r = simulate(defaults);
    if (r.crossoverPatrimonio === null) {
      // No flip — verify all years have the same sign (excluding zeros)
      let firstSign = null;
      for (const y of r.yearly) {
        if (y.anio === 0) continue;
        const sign = Math.sign(y.equity - y.etf);
        if (sign === 0) continue;
        if (firstSign === null) firstSign = sign;
        else expect(sign).toBe(firstSign);
      }
      return;
    }
    const a = r.crossoverPatrimonio;
    const prev = r.yearly[a - 1];
    const curr = r.yearly[a];
    const prevSign = Math.sign(prev.equity - prev.etf);
    const currSign = Math.sign(curr.equity - curr.etf);
    // The flip happens AT this year
    expect(prevSign).not.toBe(currSign);
    expect(prevSign).not.toBe(0);
    expect(currSign).not.toBe(0);
    // And no earlier year flipped
    for (let i = 1; i < a; i++) {
      const p = Math.sign(r.yearly[i - 1].equity - r.yearly[i - 1].etf);
      const c = Math.sign(r.yearly[i].equity - r.yearly[i].etf);
      if (p !== 0 && c !== 0) {
        expect(p).toBe(c);
      }
    }
  });
});
