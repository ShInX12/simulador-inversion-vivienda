/**
 * admin-split.test.js
 * ================================================================
 * TDD: tests para la separación del admin en dos inputs independientes
 * (comprar / arrendar). Antes existía adminArriendo = adminInicial * 0.5.
 *
 * Los tests de independencia deben FALLAR antes de la implementación
 * (red phase), porque el arriendo aún se deriva del admin de comprar.
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
  adminArriendoInicial: 190000, // NUEVO: default = 50% del de comprar (preserva compatibilidad)
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
  seguroVidaPct: 0, // aísla este test del seguro (testea el split de admin, no el seguro)
  seguroIncendioPct: 0
};

describe('Admin split — regression', () => {
  it('Default adminArriendoInicial=190000 reproduces old behavior (= adminInicial × 0.5)', () => {
    const r = simulate(defaults);
    // costoArriendoMes año 0 = arriendo + adminArriendo = 1.6M + 190k = 1.79M
    expect(r.yearly[0].costoArriendoMes).toBeCloseTo(1.6e6 + 190000, 0);
    // costoCompraMes año 0 = cuota + adminInicial
    expect(r.yearly[0].costoCompraMes).toBeCloseTo(r.cuota + 380000, 0);
  });
});

describe('Admin split — independence', () => {
  it('Changing buyer admin does NOT affect renter costs', () => {
    const base = simulate(defaults);
    const moreBuyerAdmin = simulate({ ...defaults, adminInicial: 800000 });
    // Renter unchanged
    expect(moreBuyerAdmin.yearly[0].costoArriendoMes).toBeCloseTo(base.yearly[0].costoArriendoMes, 0);
    // Buyer changed
    expect(moreBuyerAdmin.yearly[0].costoCompraMes).not.toBeCloseTo(base.yearly[0].costoCompraMes, 0);
  });

  it('Changing renter admin does NOT affect buyer costs', () => {
    const base = simulate(defaults);
    const moreRenterAdmin = simulate({ ...defaults, adminArriendoInicial: 400000 });
    // Buyer unchanged
    expect(moreRenterAdmin.yearly[0].costoCompraMes).toBeCloseTo(base.yearly[0].costoCompraMes, 0);
    // Renter changed
    expect(moreRenterAdmin.yearly[0].costoArriendoMes).toBeCloseTo(1.6e6 + 400000, 0);
  });
});
