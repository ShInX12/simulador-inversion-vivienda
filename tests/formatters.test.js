import { describe, it, expect } from 'vitest';
import { fmtCOP, fmtCOPCuota, fmtPct, fmtUSD } from '../js/ui.js';

describe('fmtCOP', () => {
  it('formats zero', () => {
    expect(fmtCOP(0)).toBe('$0');
  });

  it('formats sub-thousand values', () => {
    expect(fmtCOP(500)).toBe('$500');
  });

  it('formats thousands as $XXk', () => {
    expect(fmtCOP(380000)).toBe('$380k');
  });

  it('formats millions as $XM (default 0 decimals)', () => {
    expect(fmtCOP(1.6e6)).toBe('$2M'); // rounds 1.6 to 2 with 0 decimals
  });

  it('formats millions with decimals when requested', () => {
    expect(fmtCOP(1.6e6, 1)).toBe('$1.6M');
  });

  it('formats billions as $X.XB', () => {
    expect(fmtCOP(2.5e9)).toBe('$2.5B');
  });

  it('handles negative values with proper minus sign', () => {
    expect(fmtCOP(-152e6)).toBe('−$152M');
  });
});

describe('fmtCOPCuota', () => {
  it('always uses 2 decimals in millions', () => {
    expect(fmtCOPCuota(2.107e6)).toBe('$2.11M');
    expect(fmtCOPCuota(1e6)).toBe('$1.00M');
    expect(fmtCOPCuota(937000)).toBe('$0.94M');
  });
});

describe('fmtPct', () => {
  it('formats with default 0 decimals', () => {
    expect(fmtPct(10)).toBe('10%');
    expect(fmtPct(5)).toBe('5%');
  });

  it('formats with N decimals when requested', () => {
    expect(fmtPct(10, 1)).toBe('10.0%');
    expect(fmtPct(5.5, 1)).toBe('5.5%');
    expect(fmtPct(3, 2)).toBe('3.00%');
  });

  it('handles zero', () => {
    expect(fmtPct(0)).toBe('0%');
  });
});

describe('fmtUSD', () => {
  it('formats zero', () => {
    expect(fmtUSD(0)).toBe('$0');
  });

  it('formats $250 with no separator needed', () => {
    expect(fmtUSD(250)).toBe('$250');
  });

  it('formats $9285.71 with rounding (no decimals shown)', () => {
    expect(fmtUSD(9285.71)).toBe('$9,286');
  });

  it('formats $43287 with thousands separator', () => {
    expect(fmtUSD(43287)).toBe('$43,287');
  });

  it('formats large numbers with thousands separators', () => {
    expect(fmtUSD(1234567)).toBe('$1,234,567');
  });
});
