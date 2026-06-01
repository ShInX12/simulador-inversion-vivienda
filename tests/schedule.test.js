/**
 * schedule.test.js
 * ================================================================
 * TDD: amortizationSchedule — tabla de amortización mes a mes.
 * Valida al peso: Σcapital = monto, Σinterés = totalIntereses, saldo final ≈ 0.
 * Deben FALLAR antes de la implementación (red phase).
 * ================================================================
 */

import { describe, it, expect } from 'vitest';
import { simulate, amortizationSchedule, scheduleTotals } from '../js/calculator.js';

const defaults = {
  precio: 250e6,
  cuotaInicialPct: 20,
  escrituracionPct: 5.5,
  apreciacionPct: 4.5,
  tasaEA: 9.5,
  plazoAnios: 20,
  arriendoInicial: 1.6e6,
  ipcPct: 5,
  adminInicial: 380000,
  adminArriendoInicial: 190000,
  seguroVidaPct: 0.05,
  seguroIncendioPct: 0.045,
  retornoEtfUsdPct: 8,
  modo: 'aporte-fijo',
  aporteMensualUsd: 250,
  aporteIncrementoPct: 8,
  invertirCashInicial: true,
  tasaCopUsdInicial: 4200,
  devaluacionAnualPct: 3,
  aplicarImpuestos: false,
  tarifaRentaMarginal: 33,
  tarifaGananciaViviendaPct: 10,
  costoVentaViviendaPct: 5,
  viviendaPrimera: true,
  aporteAfcMensual: 0,
  salarioMensual: 5e6,
  crecimientoSalarialPct: 5
};

describe('amortizationSchedule', () => {
  it('returns plazoAnios × 12 rows', () => {
    const s = amortizationSchedule(defaults);
    expect(s.length).toBe(defaults.plazoAnios * 12);
  });

  it('capital sums to the financed amount (monto)', () => {
    const s = amortizationSchedule(defaults);
    const monto = defaults.precio - defaults.precio * defaults.cuotaInicialPct / 100; // 200M
    const sumaCapital = s.reduce((acc, r) => acc + r.capital, 0);
    expect(sumaCapital).toBeCloseTo(monto, 0);
  });

  it('interest sums to totalIntereses (matches simulate)', () => {
    const s = amortizationSchedule(defaults);
    const sumaInteres = s.reduce((acc, r) => acc + r.interes, 0);
    const r = simulate(defaults);
    expect(sumaInteres).toBeCloseTo(r.totalIntereses, 0);
  });

  it('final balance ≈ 0', () => {
    const s = amortizationSchedule(defaults);
    expect(s[s.length - 1].saldo).toBeCloseTo(0, 0);
  });

  it('every row: cuotaTotal = cuota + seguroVida + seguroIncendio', () => {
    const s = amortizationSchedule(defaults);
    for (const r of s) {
      expect(r.cuotaTotal).toBeCloseTo(r.cuota + r.seguroVida + r.seguroIncendio, 4);
    }
  });

  it('seguro vida decreases, seguro incendio is fixed', () => {
    const s = amortizationSchedule(defaults);
    expect(s[0].seguroVida).toBeGreaterThan(s[s.length - 1].seguroVida);
    expect(s[0].seguroIncendio).toBeCloseTo(s[s.length - 1].seguroIncendio, 6);
  });

  it('scheduleTotals sums each column; capital total = monto, interes total = totalIntereses', () => {
    const s = amortizationSchedule(defaults);
    const t = scheduleTotals(s);
    const monto = defaults.precio - defaults.precio * defaults.cuotaInicialPct / 100;
    expect(t.capital).toBeCloseTo(monto, 0);
    expect(t.interes).toBeCloseTo(simulate(defaults).totalIntereses, 0);
    // identidad: cuotaTotal_total = interes + capital + segVida + segIncendio
    expect(t.cuotaTotal).toBeCloseTo(t.interes + t.capital + t.seguroVida + t.seguroIncendio, 0);
    // cuota total = interes + capital
    expect(t.cuota).toBeCloseTo(t.interes + t.capital, 0);
  });

  it('FNA case: row 1 cuotaTotal ≈ cuota pura + seguros iniciales', () => {
    const s = amortizationSchedule(defaults); // monto 200M, tasa 9.5%
    const cuotaPura = s[0].cuota;
    const seg = s[0].seguroVida + s[0].seguroIncendio;
    expect(s[0].cuotaTotal).toBeCloseTo(cuotaPura + seg, 0);
    // cuota pura ≈ 1,813,605; seguros ≈ 100k (vida) + 112.5k (incendio)
    expect(s[0].seguroVida).toBeCloseTo(200e6 * 0.05 / 100, 0);     // 100000
    expect(s[0].seguroIncendio).toBeCloseTo(250e6 * 0.045 / 100, 0); // 112500
  });
});
