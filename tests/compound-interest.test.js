/**
 * compound-interest.test.js
 * ================================================================
 * TDD: tests para las series del gráfico de interés compuesto del ETF.
 * Cada yearly[] debe exponer DOS series en USD:
 *   - etfValorUsd     → valor del portafolio CON interés compuesto
 *   - aportadoAcumUsd → plata aportada acumulada SIN crecimiento (cost basis)
 * La brecha entre ambas = interés compuesto generado.
 *
 * Deben FALLAR antes de la implementación (red phase).
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

describe('ETF compound-interest series', () => {
  it('cada yearly[] expone etfValorUsd y aportadoAcumUsd numéricos y finitos', () => {
    const r = simulate(defaults);
    for (const y of r.yearly) {
      expect(typeof y.etfValorUsd).toBe('number');
      expect(Number.isFinite(y.etfValorUsd)).toBe(true);
      expect(typeof y.aportadoAcumUsd).toBe('number');
      expect(Number.isFinite(y.aportadoAcumUsd)).toBe(true);
    }
  });

  it('aportadoAcumUsd es monótonamente no decreciente (solo se aporta, nunca se retira)', () => {
    const r = simulate(defaults);
    for (let i = 1; i < r.yearly.length; i++) {
      expect(r.yearly[i].aportadoAcumUsd).toBeGreaterThanOrEqual(r.yearly[i - 1].aportadoAcumUsd);
    }
  });

  it('con retorno ETF positivo, el valor final supera lo aportado (hay interés compuesto)', () => {
    const r = simulate({ ...defaults, retornoEtfUsdPct: 8 });
    const last = r.yearly[r.yearly.length - 1];
    expect(last.etfValorUsd).toBeGreaterThan(last.aportadoAcumUsd);
  });

  it('con retorno ETF = 0, valor ≈ aportes en cada año (sin interés compuesto)', () => {
    const r = simulate({ ...defaults, retornoEtfUsdPct: 0 });
    for (const y of r.yearly) {
      expect(y.etfValorUsd).toBeCloseTo(y.aportadoAcumUsd, 6);
    }
  });

  it('el etfValorUsd del último año coincide con result.etfFinalUsd', () => {
    const r = simulate(defaults);
    const last = r.yearly[r.yearly.length - 1];
    expect(last.etfValorUsd).toBeCloseTo(r.etfFinalUsd, 6);
  });
});
