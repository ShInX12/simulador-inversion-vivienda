/**
 * insurance.test.js
 * ================================================================
 * TDD: seguro de hipoteca en DOS componentes:
 *   - vida deudor: % mensual del saldo pendiente (decrece)
 *   - incendio: % mensual del valor inicial de la vivienda (fijo)
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
  adminArriendoInicial: 190000,
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
  aporteAfcMensual: 0,
  salarioMensual: 5e6,
  crecimientoSalarialPct: 5,
  seguroVidaPct: 0.05,
  seguroIncendioPct: 0.045
};

describe('Mortgage insurance — two components', () => {
  it('seguroMensualInicial = monto × vida% + precio × incendio%', () => {
    // monto = 250M × (1 - 0.20) = 200M. vida = 200M×0.05% = 100000. incendio = 250M×0.045% = 112500.
    const r = simulate({ ...defaults, precio: 250e6, cuotaInicialPct: 20, seguroVidaPct: 0.05, seguroIncendioPct: 0.045 });
    expect(r.seguroMensualInicial).toBeCloseTo(212500, 0);
  });

  it('vida deudor decreases over time (vida>0, incendio=0)', () => {
    const r = simulate({
      ...defaults,
      seguroVidaPct: 0.05,
      seguroIncendioPct: 0,
      adminInicial: 0,
      adminArriendoInicial: 0,
      ipcPct: 0
    });
    expect(r.yearly[1].costoCompraMes).toBeGreaterThan(r.yearly[20].costoCompraMes);
  });

  it('incendio is fixed — does NOT decrease (vida=0, incendio>0)', () => {
    const r = simulate({
      ...defaults,
      seguroVidaPct: 0,
      seguroIncendioPct: 0.045,
      adminInicial: 0,
      adminArriendoInicial: 0,
      ipcPct: 0
    });
    // Only cuota (fixed) + incendio (fixed on initial value) → costo mensual constant
    expect(r.yearly[1].costoCompraMes).toBeCloseTo(r.yearly[20].costoCompraMes, 0);
  });

  it('both rates 0 → no insurance', () => {
    const r = simulate({ ...defaults, seguroVidaPct: 0, seguroIncendioPct: 0 });
    expect(r.seguroMensualInicial).toBe(0);
  });

  it('insurance (either component) adds to sunk costs', () => {
    const withIns = simulate({ ...defaults, seguroVidaPct: 0.05, seguroIncendioPct: 0.045 });
    const noIns = simulate({ ...defaults, seguroVidaPct: 0, seguroIncendioPct: 0 });
    expect(withIns.final.gastoCompraSunkAcum).toBeGreaterThan(noIns.final.gastoCompraSunkAcum);
  });
});
