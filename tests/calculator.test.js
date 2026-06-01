import { describe, it, expect } from 'vitest';
import {
  simulate,
  eaToMonthly,
  monthlyPayment,
  totalInterest
} from '../js/calculator.js';

// ----------------------------------------------------------------
// Defaults helper — reuse across simulate() tests
// ----------------------------------------------------------------
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
  seguroVidaPct: 0, // estos tests anteceden al seguro; lo fijan en 0 para aislar su escenario
  seguroIncendioPct: 0
};

// ----------------------------------------------------------------
// Utility functions
// ----------------------------------------------------------------

describe('eaToMonthly', () => {
  it('converts 10% EA to monthly ≈ 0.7974%', () => {
    expect(eaToMonthly(10)).toBeCloseTo(0.007974140409, 6);
  });

  it('returns 0 for 0% EA', () => {
    expect(eaToMonthly(0)).toBe(0);
  });

  it('converts 5% EA to monthly ≈ 0.4074%', () => {
    expect(eaToMonthly(5)).toBeCloseTo(0.004074123577, 6);
  });

  it('converts 100% EA to monthly ≈ 5.95%', () => {
    expect(eaToMonthly(100)).toBeCloseTo(0.059463094359, 6);
  });
});

describe('monthlyPayment (sistema francés)', () => {
  it('FORMULAS.md §10: $100M / 10% EA / 20y ≈ $937k', () => {
    expect(monthlyPayment(100e6, 10, 20)).toBeCloseTo(937000, -3); // ±$1k tolerance
  });

  it('$200M / 8% EA / 15y → $1,879,212 (formula exacta — la doc dice ~$1.86M, off por ~1%)', () => {
    // Docs FORMULAS.md §10 redondean a $1.86M, pero la fórmula precisa con EA→mensual
    // da $1,879,212. La doc está aproximada — futuro update de docs debería corregirlo.
    expect(monthlyPayment(200e6, 8, 15)).toBeCloseTo(1879212, 0); // ±$0.5
  });

  it('FORMULAS.md §10: 0% rate / $120M / 10y → exact $1M', () => {
    expect(monthlyPayment(120e6, 0, 10)).toBe(1e6);
  });

  it('returns 0 for non-positive principal', () => {
    expect(monthlyPayment(0, 10, 20)).toBe(0);
    expect(monthlyPayment(-50e6, 10, 20)).toBe(0);
  });
});

describe('totalInterest', () => {
  it('computes payment * months − principal', () => {
    // payment $1M, 10y, principal $50M → 1M*120 - 50M = $70M
    expect(totalInterest(1e6, 10, 50e6)).toBe(70e6);
  });

  it('returns ~zero when payment exactly amortizes (0% rate)', () => {
    // $120M at 0% over 10y → cuota=$1M → totalInterest = 1M*120 - 120M = 0
    const cuota = monthlyPayment(120e6, 0, 10);
    expect(totalInterest(cuota, 10, 120e6)).toBe(0);
  });
});

// ----------------------------------------------------------------
// FX Rate Engine (3 spec scenarios)
// ----------------------------------------------------------------

describe('simulate — FX Rate Engine', () => {
  it('Scenario: Initial rate — toggle ON seeds ETF at exactly cashInicial in COP', () => {
    // tasa_0 = tasaCopUsdInicial. yearly[0].etf = etfUsd × tasaCopUsdInicial.
    // With invertirCashInicial=true: etfUsd_0 = cashInicial / 4200.
    // So yearly[0].etf = (cashInicial / 4200) × 4200 = cashInicial exactly.
    const r = simulate({ ...defaults, invertirCashInicial: true });
    expect(r.yearly[0].etf).toBeCloseTo(r.cashInicial, 0);
  });

  it('Scenario: Constant FX (dev=0) — yearly[20].etf equals yearly[0].etf when retornoEtfUsd=0 and aporte=0', () => {
    // No FX growth, no ETF return, no contributions → ETF in COP stays constant
    const r = simulate({
      ...defaults,
      devaluacionAnualPct: 0,
      retornoEtfUsdPct: 0,
      aporteMensualUsd: 0,
      modo: 'aporte-fijo',
      ipcPct: 0  // also turn off IPC so diferencia mode wouldn't matter
    });
    expect(r.yearly[20].etf).toBeCloseTo(r.yearly[0].etf, 0);
  });

  it('Scenario: Compounded devaluation (dev=3) — implied tasa_240 ≈ 4200 × 1.03^20 ≈ 7588.94', () => {
    // With aporte=0, etf=0, toggle=true: etfUsd stays at cashInicial / tasaInicial.
    // yearly[20].etf = etfUsd × tasa_240. So tasa_240 = yearly[20].etf / etfUsd.
    const r = simulate({
      ...defaults,
      devaluacionAnualPct: 3,
      retornoEtfUsdPct: 0,
      aporteMensualUsd: 0,
      modo: 'aporte-fijo',
      ipcPct: 0
    });
    const impliedTasa240 = r.yearly[20].etf / r.etfFinalUsd;
    const expected = 4200 * Math.pow(1.03, 20); // ≈ 7588.94
    expect(impliedTasa240).toBeCloseTo(expected, 0); // ±$0.5
  });
});

// ----------------------------------------------------------------
// Aporte Fijo Mode Behavior (3 spec scenarios)
// ----------------------------------------------------------------

describe('simulate — Aporte Fijo Mode', () => {
  it('Scenario: First-year months — aporte=$250 USD, no growth → after 12 months etfUsd ≈ $3000', () => {
    // No initial seed, no FX growth, no ETF return → etfUsd accumulates 12 × $250 = $3000.
    const r = simulate({
      ...defaults,
      modo: 'aporte-fijo',
      aporteMensualUsd: 250,
      aporteIncrementoPct: 0,
      retornoEtfUsdPct: 0,
      devaluacionAnualPct: 0,
      invertirCashInicial: false,
      ipcPct: 0
    });
    expect(r.yearly[1].etf).toBeCloseTo(12 * 250 * 4200, -3); // 12 months × $250 × tasa = COP equivalent
  });

  it('Scenario: Step-up at month 13 — aporte=$250, incr=8% → after 24 months etfUsd ≈ 12*$250 + 12*$270 = $6240', () => {
    const r = simulate({
      ...defaults,
      modo: 'aporte-fijo',
      aporteMensualUsd: 250,
      aporteIncrementoPct: 8,
      retornoEtfUsdPct: 0,
      devaluacionAnualPct: 0,
      invertirCashInicial: false,
      ipcPct: 0
    });
    const expected = (12 * 250 + 12 * 270) * 4200; // 6240 × 4200 in COP
    expect(r.yearly[2].etf).toBeCloseTo(expected, -3);
  });

  it('Scenario: Zero contribution — aporte=0, incr=0, toggle=ON → ETF compounds purely from cashInicial', () => {
    // With dev=0 and etf_USD=8%, etfUsd = (cashInicial/4200) × 1.08^20 in USD.
    // yearly[20].etf = etfUsd × 4200 = cashInicial × 1.08^20.
    const r = simulate({
      ...defaults,
      modo: 'aporte-fijo',
      aporteMensualUsd: 0,
      aporteIncrementoPct: 0,
      retornoEtfUsdPct: 8,
      devaluacionAnualPct: 0,
      invertirCashInicial: true,
      ipcPct: 0
    });
    const expected = r.cashInicial * Math.pow(1.08, 20);
    expect(r.yearly[20].etf).toBeCloseTo(expected, -4); // ±$10k
  });
});

// ----------------------------------------------------------------
// Diferencia Mode Behavior (2 spec scenarios)
// ----------------------------------------------------------------

describe('simulate — Diferencia Mode', () => {
  it('Scenario: Buying more expensive than rent — ETF accumulates dif/tasa each month (no growth case)', () => {
    // ipc=0, dev=0, etf=0, toggle=false → flat costs, no growth, no seed.
    // costoCompra = cuota + adminInicial; costoArriendo = arriendoInicial + adminInicial * 0.5.
    // If costoCompra > costoArriendo, dif > 0, etfUsd += dif/tasa each month.
    const cfg = {
      ...defaults,
      modo: 'diferencia',
      aporteMensualUsd: 0, // ignored in diferencia mode
      retornoEtfUsdPct: 0,
      devaluacionAnualPct: 0,
      invertirCashInicial: false,
      ipcPct: 0
    };
    const r = simulate(cfg);

    // Compute expected per-month diff manually
    const cuota = monthlyPayment(cfg.precio - cfg.precio * cfg.cuotaInicialPct / 100, cfg.tasaEA, cfg.plazoAnios);
    const costoCompra = cuota + cfg.adminInicial;
    const costoArriendo = cfg.arriendoInicial + cfg.adminInicial * 0.5;
    const dif = costoCompra - costoArriendo;

    if (dif > 0) {
      // 12 months of contribution at constant tasa, no return → yearly[1].etf = 12*dif
      expect(r.yearly[1].etf).toBeCloseTo(12 * dif, -3);
    } else {
      expect(r.yearly[1].etf).toBe(0);
    }
  });

  it('Scenario: Renting more expensive than buying — no ETF contribution that month', () => {
    // Set up: very high arriendo, low admin → costoArriendo > costoCompra from month 1
    const r = simulate({
      ...defaults,
      arriendoInicial: 5e6, // very high
      adminInicial: 100000,
      modo: 'diferencia',
      retornoEtfUsdPct: 0,
      devaluacionAnualPct: 0,
      invertirCashInicial: false,
      ipcPct: 0
    });
    // With huge arriendo, costoCompra < costoArriendo every month → no contribution.
    expect(r.yearly[1].etf).toBe(0);
  });
});

// ----------------------------------------------------------------
// Initial Cash Investment Toggle (2 spec scenarios)
// ----------------------------------------------------------------

describe('simulate — Cash Investment Toggle', () => {
  it('Scenario: Toggle ON — yearly[0].etf equals cashInicial', () => {
    const r = simulate({ ...defaults, invertirCashInicial: true });
    expect(r.yearly[0].etf).toBeCloseTo(r.cashInicial, 0);
  });

  it('Scenario: Toggle OFF — yearly[0].etf equals 0', () => {
    const r = simulate({ ...defaults, invertirCashInicial: false });
    expect(r.yearly[0].etf).toBe(0);
  });
});

// ----------------------------------------------------------------
// ETF USD Reporting (1 spec scenario)
// ----------------------------------------------------------------

describe('simulate — ETF USD Reporting', () => {
  it('Scenario: result.etfFinalUsd is present and is a positive number for default inputs', () => {
    const r = simulate({ ...defaults });
    expect(r.etfFinalUsd).toBeGreaterThan(0);
    expect(typeof r.etfFinalUsd).toBe('number');
    expect(Number.isFinite(r.etfFinalUsd)).toBe(true);
  });

  it('yearly[20].etf equals etfFinalUsd × tasa_240 (within rounding)', () => {
    const r = simulate({ ...defaults });
    // Implied tasa_240 = yearly[20].etf / etfFinalUsd. Should match 4200 × 1.03^20.
    const impliedTasa = r.yearly[20].etf / r.etfFinalUsd;
    const expected = 4200 * Math.pow(1.03, 20);
    expect(impliedTasa).toBeCloseTo(expected, 0);
  });
});

// ----------------------------------------------------------------
// Sanity / smoke
// ----------------------------------------------------------------

describe('simulate — sanity smoke test', () => {
  it('default inputs produce a valid result with all expected fields', () => {
    const r = simulate({ ...defaults });
    expect(r.input).toBeDefined();
    expect(r.cashInicial).toBeGreaterThan(0);
    expect(r.monto).toBeGreaterThan(0);
    expect(r.cuota).toBeGreaterThan(0);
    expect(r.totalIntereses).toBeGreaterThan(0);
    expect(Array.isArray(r.yearly)).toBe(true);
    expect(r.yearly.length).toBe(21); // year 0..20
    expect(r.final).toBe(r.yearly[20]);
    expect(r.etfFinalUsd).toBeGreaterThan(0);
    expect(['compra', 'arriendo']).toContain(r.gana);
  });

  it('default cuota matches FORMULAS.md §10 sanity (≈$2.11M)', () => {
    const r = simulate({ ...defaults });
    expect(r.cuota).toBeCloseTo(2.107e6, -4); // ±$10k
  });

  it('cuota for $100M / 10% / 20y in simulate matches monthlyPayment directly', () => {
    const r = simulate({
      ...defaults,
      precio: 100e6 / 0.9, // make so monto = 100M (since ci=10%)
      cuotaInicialPct: 10
    });
    expect(r.cuota).toBeCloseTo(monthlyPayment(100e6, 10, 20), -2); // ±$100
  });
});
