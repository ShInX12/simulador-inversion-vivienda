/**
 * scorecard.test.js
 * ================================================================
 * TDD: tests para los campos derivados del scorecard comparativo.
 * patrimonioCompraFinal / patrimonioArriendoFinal. Deben FALLAR antes
 * de la implementación (red phase).
 *
 * Invariante clave: diferencia === patrimonioCompraFinal - patrimonioArriendoFinal
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
  crecimientoSalarialPct: 5
};

describe('Scorecard derived fields', () => {
  it('result has numeric patrimonioCompraFinal and patrimonioArriendoFinal', () => {
    const r = simulate(defaults);
    expect(Number.isFinite(r.patrimonioCompraFinal)).toBe(true);
    expect(Number.isFinite(r.patrimonioArriendoFinal)).toBe(true);
  });

  it('Consistency (toggle ON): diferencia === patrimonioCompraFinal - patrimonioArriendoFinal; compra = equityNeto', () => {
    const r = simulate({ ...defaults, aplicarImpuestos: true });
    expect(r.patrimonioCompraFinal - r.patrimonioArriendoFinal).toBeCloseTo(r.diferencia, 0);
    expect(r.patrimonioCompraFinal).toBeCloseTo(r.equityNeto, 0);
  });

  it('Consistency (toggle OFF): matches gross final.equity / final.etf', () => {
    const r = simulate({ ...defaults, aplicarImpuestos: false });
    expect(r.patrimonioCompraFinal).toBeCloseTo(r.final.equity, 0);
    expect(r.patrimonioArriendoFinal).toBeCloseTo(r.final.etf, 0);
    expect(r.patrimonioCompraFinal - r.patrimonioArriendoFinal).toBeCloseTo(r.diferencia, 0);
  });
});
