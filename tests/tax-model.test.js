/**
 * tax-model.test.js
 * ================================================================
 * TDD: estos tests están escritos ANTES de la implementación.
 * Deben FALLAR en la primera corrida (red phase). La fase 2 de la
 * change `add-tax-model` lleva todos los tests a verde.
 *
 * Cubre el spec `tax-and-exit-cost-model` — 7 requirements / 11 scenarios.
 * ================================================================
 */

import { describe, it, expect } from 'vitest';
import { simulate } from '../js/calculator.js';

// ----------------------------------------------------------------
// Defaults helper — same as calculator defaults + the 6 new tax fields
// ----------------------------------------------------------------
const taxDefaults = {
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
  // NEW tax fields
  aplicarImpuestos: true,
  tarifaRentaMarginal: 33,
  tarifaGananciaViviendaPct: 10,
  costoVentaViviendaPct: 5,
  viviendaPrimera: true,
  aporteAfcMensual: 0
};

// ----------------------------------------------------------------
// REQ 1: Tax Model Toggle (2 scenarios)
// ----------------------------------------------------------------

describe('Tax Model Toggle', () => {
  it('Toggle OFF: diferencia equals pre-change formula (final.equity − final.etf)', () => {
    const r = simulate({ ...taxDefaults, aplicarImpuestos: false });
    expect(r.diferencia).toBeCloseTo(r.final.equity - r.final.etf, 0);
    // New fields must still be defined (informational), even with toggle off
    expect(r.equityNeto).toBeDefined();
    expect(r.etfFinalUsdNeto).toBeDefined();
    expect(r.impuestos).toBeDefined();
  });

  it('Toggle ON: diferencia uses equityNeto − etfFinalUsdNeto × tasa_240', () => {
    const r = simulate({ ...taxDefaults });
    // Implied tasa_240 = yearly[20].etf / etfFinalUsd
    const tasa240 = r.yearly[20].etf / r.etfFinalUsd;
    const expectedDif = r.equityNeto - r.etfFinalUsdNeto * tasa240;
    expect(r.diferencia).toBeCloseTo(expectedDif, 0);
  });
});

// ----------------------------------------------------------------
// REQ 2: Aportado Total USD Tracking (1 scenario, indirect)
// ----------------------------------------------------------------

describe('Aportado Total USD Tracking', () => {
  it('No-growth no-AFC no-seed scenario: rentaEtf=0 (basis equals final value)', () => {
    const r = simulate({
      ...taxDefaults,
      modo: 'aporte-fijo',
      aporteMensualUsd: 250,
      aporteIncrementoPct: 0,
      retornoEtfUsdPct: 0,
      devaluacionAnualPct: 0,
      invertirCashInicial: false,
      aporteAfcMensual: 0,
      ipcPct: 0
    });
    // aportadoTotal = 240 × 250 = 60_000 USD; etfFinalUsd should also be 60_000.
    expect(r.etfFinalUsd).toBeCloseTo(60000, 0);
    expect(r.impuestos.rentaEtf).toBeCloseTo(0, 6);
    expect(r.etfFinalUsdNeto).toBeCloseTo(r.etfFinalUsd, 6);
  });
});

// ----------------------------------------------------------------
// REQ 3: ETF Liquidation Tax (2 scenarios)
// ----------------------------------------------------------------

describe('ETF Liquidation Tax', () => {
  it('With ETF growth: tax = (etfFinalUsd − aportadoTotal) × tarifaRentaMarginal', () => {
    const r = simulate({
      ...taxDefaults,
      modo: 'aporte-fijo',
      aporteMensualUsd: 250,
      aporteIncrementoPct: 0,
      retornoEtfUsdPct: 8,
      devaluacionAnualPct: 0,
      invertirCashInicial: false,
      aporteAfcMensual: 0,
      ipcPct: 0,
      tarifaRentaMarginal: 33
    });
    // aportadoTotal = 60_000 (no seed, no AFC, no growth in aporte). etfFinalUsd > 60_000 from 8% return.
    const utility = r.etfFinalUsd - 60000;
    expect(utility).toBeGreaterThan(0);
    expect(r.impuestos.rentaEtf).toBeCloseTo(utility * 0.33, 0);
    expect(r.etfFinalUsdNeto).toBeLessThan(r.etfFinalUsd);
    expect(r.etfFinalUsdNeto).toBeCloseTo(r.etfFinalUsd - r.impuestos.rentaEtf, 6);
  });

  it('When utility ≤ 0 (no growth, only seed): rentaEtf = 0', () => {
    const r = simulate({
      ...taxDefaults,
      modo: 'aporte-fijo',
      aporteMensualUsd: 0,
      aporteIncrementoPct: 0,
      retornoEtfUsdPct: 0,
      devaluacionAnualPct: 0,
      invertirCashInicial: true,
      aporteAfcMensual: 0,
      ipcPct: 0
    });
    // etfUsd = cashInicial/4200 forever; aportadoTotal = cashInicial/4200; utility = 0.
    expect(r.impuestos.rentaEtf).toBeCloseTo(0, 2);
  });
});

// ----------------------------------------------------------------
// REQ 4: AFC Refund Mechanic (2 scenarios)
// ----------------------------------------------------------------

describe('AFC Refund Mechanic', () => {
  it('AFC aporte=$1M, tarifa=33% → refundAfcTotalCop after 20y = $79.2M', () => {
    const r = simulate({
      ...taxDefaults,
      aporteAfcMensual: 1_000_000,
      tarifaRentaMarginal: 33
    });
    // Annual refund = 12 × 1M × 33% = $3.96M. Over 20 years = $79.2M.
    expect(r.impuestos.refundAfcTotalCop).toBeCloseTo(79200000, -3);
  });

  it('AFC aporte=0 → refundAfcTotalCop = 0', () => {
    const r = simulate({ ...taxDefaults, aporteAfcMensual: 0 });
    expect(r.impuestos.refundAfcTotalCop).toBe(0);
  });
});

// ----------------------------------------------------------------
// REQ 5: Vivienda Primera Exemption (2 scenarios)
// ----------------------------------------------------------------

describe('Vivienda Primera Exemption', () => {
  it('viviendaPrimera=true with defaults: exemption covers utility → gananciaVivienda = 0', () => {
    const r = simulate({ ...taxDefaults, viviendaPrimera: true });
    // Utility ≈ 250M × 1.045^20 − 250M ≈ 353M.
    // Exemption = 7500 × 51_000 × 1.05^20 ≈ 1,014,745,000.
    // Exemption > utility → tax = 0.
    expect(r.impuestos.gananciaVivienda).toBeCloseTo(0, 0);
  });

  it('viviendaPrimera=false: full utility taxed at tarifaGananciaViviendaPct', () => {
    const r = simulate({ ...taxDefaults, viviendaPrimera: false, tarifaGananciaViviendaPct: 10 });
    const utility = r.final.valorVivienda - r.input.precio;
    expect(r.impuestos.gananciaVivienda).toBeCloseTo(utility * 0.10, 0);
  });
});

// ----------------------------------------------------------------
// REQ 6: Vivienda Sale Costs + equityNeto (1 scenario)
// ----------------------------------------------------------------

describe('Vivienda Sale Costs + equityNeto', () => {
  it('costosVenta = 5% × valorViviendaFinal; equityNeto = valor − saldo − impuestoVivienda − costosVenta', () => {
    const r = simulate({ ...taxDefaults });
    const expectedCostos = r.final.valorVivienda * 0.05;
    expect(r.impuestos.costosVenta).toBeCloseTo(expectedCostos, 0);

    const expectedEquityNeto = Math.max(
      0,
      r.final.valorVivienda - r.final.saldo - r.impuestos.gananciaVivienda - r.impuestos.costosVenta
    );
    expect(r.equityNeto).toBeCloseTo(expectedEquityNeto, 0);
  });
});

// ----------------------------------------------------------------
// REQ 7: Result Object Extension (1 scenario)
// ----------------------------------------------------------------

describe('Result Object Extension', () => {
  it('All new fields are defined finite numbers regardless of toggle', () => {
    const r = simulate({ ...taxDefaults });
    expect(Number.isFinite(r.etfFinalUsdNeto)).toBe(true);
    expect(Number.isFinite(r.equityNeto)).toBe(true);
    expect(r.impuestos).toBeDefined();
    expect(Number.isFinite(r.impuestos.rentaEtf)).toBe(true);
    expect(Number.isFinite(r.impuestos.gananciaVivienda)).toBe(true);
    expect(Number.isFinite(r.impuestos.costosVenta)).toBe(true);
    expect(Number.isFinite(r.impuestos.refundAfcTotalCop)).toBe(true);
  });
});
