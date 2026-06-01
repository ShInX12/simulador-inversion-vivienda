/**
 * salary-burden.test.js
 * ================================================================
 * TDD: tests para la carga financiera (costo mensual total / salario).
 * cargaCompraPct y cargaArriendoPct en yearly[]. Deben FALLAR antes
 * de la implementación (red phase).
 *
 * Visualization-only: NO afecta diferencia ni patrimonio.
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
  aporteAfcMensual: 0,
  salarioMensual: 5e6,
  crecimientoSalarialPct: 5
};

describe('Salary burden tracking', () => {
  it('Each yearly[] entry has numeric cargaCompraPct and cargaArriendoPct', () => {
    const r = simulate(defaults);
    for (const y of r.yearly) {
      expect(typeof y.cargaCompraPct).toBe('number');
      expect(typeof y.cargaArriendoPct).toBe('number');
      expect(Number.isFinite(y.cargaCompraPct)).toBe(true);
      expect(Number.isFinite(y.cargaArriendoPct)).toBe(true);
    }
  });

  it('Year 0 exact: carga = costo total inicial / salario × 100', () => {
    const r = simulate(defaults);
    // comprar = (cuota + adminInicial) / salario
    expect(r.yearly[0].cargaCompraPct).toBeCloseTo((r.cuota + 380000) / 5e6 * 100, 4);
    // arrendar = (arriendo + adminArriendo=190k) / salario
    expect(r.yearly[0].cargaArriendoPct).toBeCloseTo((1.6e6 + 190000) / 5e6 * 100, 4);
  });

  it('Invariant: when crecimientoSalarial === ipc, renter burden stays constant', () => {
    const r = simulate({ ...defaults, ipcPct: 5, crecimientoSalarialPct: 5 });
    for (let i = 1; i < r.yearly.length; i++) {
      expect(r.yearly[i].cargaArriendoPct).toBeCloseTo(r.yearly[0].cargaArriendoPct, 2);
    }
  });

  it('Invariant: with salary growing, buyer burden declines (cuota fixed)', () => {
    const r = simulate({ ...defaults, crecimientoSalarialPct: 5 });
    expect(r.yearly[20].cargaCompraPct).toBeLessThan(r.yearly[0].cargaCompraPct);
  });

  it('Invariant: with zero salary growth, buyer burden rises (admin inflates, salary flat)', () => {
    const r = simulate({ ...defaults, crecimientoSalarialPct: 0 });
    expect(r.yearly[20].cargaCompraPct).toBeGreaterThan(r.yearly[0].cargaCompraPct);
  });
});
