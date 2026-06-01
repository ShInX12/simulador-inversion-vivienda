/**
 * spending.test.js
 * ================================================================
 * Tests para gasto NO RECUPERABLE acumulado (sunk costs).
 * - Comprador: escrituración + intereses + admin (NO cuota inicial, NO capital)
 * - Arrendatario: arriendo + adminArriendo (todo es sunk siempre)
 *
 * Ver `openspec/changes/archive/2026-05-01-spending-chart-sunk-costs/proposal.md`
 * para el rationale.
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

describe('Cumulative sunk-cost spending tracking', () => {
  it('Each yearly[] entry has numeric gastoCompraSunkAcum and gastoArriendoAcum', () => {
    const r = simulate(defaults);
    for (const y of r.yearly) {
      expect(typeof y.gastoCompraSunkAcum).toBe('number');
      expect(typeof y.gastoArriendoAcum).toBe('number');
      expect(Number.isFinite(y.gastoCompraSunkAcum)).toBe(true);
      expect(Number.isFinite(y.gastoArriendoAcum)).toBe(true);
    }
  });

  it('Both sunk accumulators are monotonically non-decreasing year over year', () => {
    const r = simulate(defaults);
    for (let i = 1; i < r.yearly.length; i++) {
      expect(r.yearly[i].gastoCompraSunkAcum).toBeGreaterThanOrEqual(r.yearly[i - 1].gastoCompraSunkAcum);
      expect(r.yearly[i].gastoArriendoAcum).toBeGreaterThanOrEqual(r.yearly[i - 1].gastoArriendoAcum);
    }
  });

  it('yearly[0]: gastoCompraSunkAcum equals escrituración (NOT cashInicial); gastoArriendoAcum equals 0', () => {
    const r = simulate(defaults);
    const escrituracion = defaults.precio * defaults.escrituracionPct / 100; // 250e6 * 0.055 = 13_750_000
    expect(r.yearly[0].gastoCompraSunkAcum).toBeCloseTo(escrituracion, 0);
    expect(r.yearly[0].gastoArriendoAcum).toBe(0);
  });

  it('Sanity: yearly[20].gastoCompraSunkAcum ≈ escrituración + intereses_total + admin_acum (~$445M ±$50M con defaults)', () => {
    const r = simulate(defaults);
    const escrituracion = defaults.precio * defaults.escrituracionPct / 100;
    const expected = escrituracion + r.totalIntereses + 150e6; // admin ~150M acum 20y con IPC 5%
    // Tolerance: ±$50M for IPC compounding effects on admin
    expect(r.yearly[20].gastoCompraSunkAcum).toBeGreaterThan(expected - 50e6);
    expect(r.yearly[20].gastoCompraSunkAcum).toBeLessThan(expected + 50e6);
  });
});

describe('Spending crossover detection (sunk-cost basis)', () => {
  it('spendingCrossoverYear is null or a finite year between 1 and 20; if not null, it captures the first sign flip in (sunk_compra - sunk_arriendo)', () => {
    const r = simulate(defaults);
    const valid =
      r.spendingCrossoverYear === null ||
      (typeof r.spendingCrossoverYear === 'number' &&
        r.spendingCrossoverYear >= 1 &&
        r.spendingCrossoverYear <= 20);
    expect(valid).toBe(true);

    if (r.spendingCrossoverYear === null) return;

    const a = r.spendingCrossoverYear;
    const prev = r.yearly[a - 1];
    const curr = r.yearly[a];
    const prevSign = Math.sign(prev.gastoCompraSunkAcum - prev.gastoArriendoAcum);
    const currSign = Math.sign(curr.gastoCompraSunkAcum - curr.gastoArriendoAcum);
    expect(prevSign).not.toBe(currSign);
    expect(prevSign).not.toBe(0);
    expect(currSign).not.toBe(0);

    // No earlier flip
    for (let i = 1; i < a; i++) {
      const p = Math.sign(r.yearly[i - 1].gastoCompraSunkAcum - r.yearly[i - 1].gastoArriendoAcum);
      const c = Math.sign(r.yearly[i].gastoCompraSunkAcum - r.yearly[i].gastoArriendoAcum);
      if (p !== 0 && c !== 0) {
        expect(p).toBe(c);
      }
    }
  });
});
