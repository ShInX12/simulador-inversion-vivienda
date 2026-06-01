/**
 * crossover-bug.test.js
 * ================================================================
 * Captura el bug de coherencia entre la métrica "Año del cruce" y
 * el chart "Comprar vs arrendar".
 *
 * EXPECTATION: este test puede pasar (bug arreglado) o fallar (bug
 * persiste). Su valor está en la EVIDENCIA — sea cual sea el
 * resultado, sabemos con certeza qué pasa.
 *
 * Si falla: la próxima change debe arreglar la asimetría entre la
 *           detección del crossover y los valores almacenados en yearly[].
 * Si pasa: el fix anterior funcionó y el test queda como regression
 *          guard para que no vuelva a romperse.
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
  devaluacionAnualPct: 3
};

function findFirstChartCross(yearly) {
  for (const y of yearly) {
    if (y.anio > 0 && y.costoArriendoMes > y.costoCompraMes) {
      return y.anio;
    }
  }
  return null;
}

describe('Cost crossover: chart and metric coherence', () => {
  it('with default inputs, the first year where chart shows costoArriendoMes > costoCompraMes equals result.crossover (within 1 year tolerance)', () => {
    const r = simulate({ ...defaults });
    const firstChartCross = findFirstChartCross(r.yearly);

    expect(firstChartCross).not.toBeNull();
    expect(r.crossover).not.toBeNull();
    expect(Math.abs(firstChartCross - r.crossover)).toBeLessThanOrEqual(1);
  });

  it('with high-priced + high-rent inputs, chart and metric still agree (within 1 year tolerance)', () => {
    const r = simulate({
      ...defaults,
      precio: 400e6,
      arriendoInicial: 2.5e6,
      adminInicial: 500000
    });
    const firstChartCross = findFirstChartCross(r.yearly);

    expect(firstChartCross).not.toBeNull();
    expect(r.crossover).not.toBeNull();
    expect(Math.abs(firstChartCross - r.crossover)).toBeLessThanOrEqual(1);
  });

  it('with low-priced + low-rent inputs, chart and metric still agree', () => {
    const r = simulate({
      ...defaults,
      precio: 150e6,
      arriendoInicial: 1.0e6,
      adminInicial: 200000
    });
    const firstChartCross = findFirstChartCross(r.yearly);

    // If both are null (no crossover ever), they're consistent
    if (firstChartCross === null && r.crossover === null) {
      expect(true).toBe(true);
      return;
    }
    expect(firstChartCross).not.toBeNull();
    expect(r.crossover).not.toBeNull();
    expect(Math.abs(firstChartCross - r.crossover)).toBeLessThanOrEqual(1);
  });
});
