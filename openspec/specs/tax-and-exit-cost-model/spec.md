# Tax and Exit-Cost Model Specification

## Purpose

Defines how Colombian taxes and exit costs are applied at the end of the simulation horizon, plus the AFC tax-refund mechanic that runs during the loop in the renter scenario. This capability extends `etf-investment-mode` post-simulation — it does not change how the ETF balance evolves before liquidation. Constant `UVT_BASE = 51_000` (2026 reference value) is used for the vivienda-primera exemption.

## Requirements

### Requirement: Tax Model Toggle

The system MUST expose `aplicarImpuestos` (boolean), default `true`. When `true`, `result.diferencia` MUST reflect the post-tax, post-exit-cost values (`equityNeto − etfFinalUsdNeto × tasa_240`). When `false`, `result.diferencia` MUST equal the pre-change formula (`final.equity − final.etf`, both gross). The new fields (`equityNeto`, `etfFinalUsdNeto`, `impuestos`) MUST always be present in the result regardless of the toggle.

#### Scenario: Toggle OFF preserves pre-change diferencia

- GIVEN `aplicarImpuestos=false` and otherwise default inputs
- WHEN simulate runs
- THEN `result.diferencia` MUST equal `result.final.equity − result.final.etf`
- AND `result.equityNeto`, `result.etfFinalUsdNeto`, `result.impuestos` MUST still be defined

#### Scenario: Toggle ON applies post-tax math

- GIVEN `aplicarImpuestos=true` and default inputs
- WHEN simulate runs
- THEN `result.diferencia` MUST equal `result.equityNeto − result.etfFinalUsdNeto × tasa_{m=240}`

### Requirement: Aportado Total USD Tracking

The system MUST track `aportadoTotalUsd` as the running sum of all USD contributions to the renter's ETF: the seed (`cashInicial / tasaCopUsdInicial` if `invertirCashInicial=true`, else 0), each month's mode-specific contribution (USD aporte in `aporte-fijo`, COP-diff/tasa in `diferencia`), and each year-end AFC refund in USD. This running total is the cost basis for the ETF tax.

#### Scenario: Basis equals seed plus contributions when no growth

- GIVEN `modo='aporte-fijo'`, `aporteMensualUsd=250`, `aporteIncrementoPct=0`, `retornoEtfUsdPct=0`, `devaluacionAnualPct=0`, `invertirCashInicial=false`, `aporteAfcMensual=0`
- WHEN simulate runs for 20 years
- THEN `etfFinalUsd` MUST equal `aportadoTotalUsd` (no growth, no tax owed)
- AND both MUST equal `240 × 250 = 60_000` USD

### Requirement: ETF Liquidation Tax

The system MUST compute `impuestoEtfUsd = max(0, (etfFinalUsd − aportadoTotalUsd) × tarifaRentaMarginal/100)` at end of simulation. It MUST expose `etfFinalUsdNeto = etfFinalUsd − impuestoEtfUsd`.

#### Scenario: ETF tax applies on utility

- GIVEN `etfFinalUsd=100_000`, `aportadoTotalUsd=60_000`, `tarifaRentaMarginal=33`
- WHEN tax math runs
- THEN `impuestoEtfUsd` MUST equal `(100_000 − 60_000) × 0.33 = 13_200` USD
- AND `etfFinalUsdNeto` MUST equal `86_800` USD

#### Scenario: No tax when utility is zero or negative

- GIVEN `etfFinalUsd ≤ aportadoTotalUsd`
- WHEN tax math runs
- THEN `impuestoEtfUsd` MUST equal `0`

### Requirement: AFC Refund Mechanic

When `aporteAfcMensual > 0` and the renter scenario is being computed, at each year-end (`m % 12 === 0`) the system MUST add an AFC refund to the ETF. The refund in COP MUST equal `aporteAfcMensual × 12 × tarifaRentaMarginal/100`. It MUST be converted to USD at the current month's `tasa_m` and added to `etfUsd` AND to `aportadoTotalUsd`. The buyer scenario MUST NOT receive AFC refunds.

#### Scenario: AFC refund correctly added at year end

- GIVEN `aporteAfcMensual=1_000_000`, `tarifaRentaMarginal=33`, `tasaCopUsdInicial=4200`, `devaluacionAnualPct=0`
- WHEN year 1 ends
- THEN that month, the ETF MUST gain `12 × 1_000_000 × 0.33 / 4200 ≈ 942.857` USD
- AND `aportadoTotalUsd` MUST also increase by ≈ 942.857

#### Scenario: Zero AFC contribution → no refund

- GIVEN `aporteAfcMensual=0`
- WHEN any year ends
- THEN ETF MUST NOT gain any AFC refund
- AND `aportadoTotalUsd` MUST NOT change due to AFC

### Requirement: Vivienda Primera Exemption

The exemption on ganancia ocasional al vender vivienda MUST equal `7500 × UVT_BASE × (1 + ipcPct/100)^plazoAnios` when `viviendaPrimera=true`, else `0`. UVT_BASE is the constant `51_000`. The exemption MUST cap at the actual utility (it cannot create a negative tax).

#### Scenario: Exención cubre toda la utilidad — impuesto cero

- GIVEN `viviendaPrimera=true`, `precio=250_000_000`, `apreciacionPct=4.5`, `plazoAnios=20`, `ipcPct=5`
- WHEN tax math runs
- THEN `exencionVivienda` MUST equal `7500 × 51_000 × 1.05^20 ≈ 1_014_745_000`
- AND `utilidadVivienda = 250_000_000 × 1.045^20 − 250_000_000 ≈ 353_000_000`
- AND `impuestoGananciaVivienda` MUST equal `0`

#### Scenario: Sin vivienda primera — toda la utilidad gravada

- GIVEN `viviendaPrimera=false`, defaults otherwise
- WHEN tax math runs
- THEN `impuestoGananciaVivienda` MUST equal `utilidadVivienda × tarifaGananciaViviendaPct/100`

### Requirement: Vivienda Sale Costs and Equity Neto

The system MUST compute `costosVenta = valorViviendaFinal × costoVentaViviendaPct/100` and `equityNeto = max(0, valorViviendaFinal − saldoFinal − impuestoGananciaVivienda − costosVenta)`.

#### Scenario: Default 5% sale cost

- GIVEN `costoVentaViviendaPct=5`, `valorViviendaFinal=602_000_000`
- WHEN tax math runs
- THEN `costosVenta` MUST equal `30_100_000`

### Requirement: Result Object Extension

The simulation result MUST expose: `etfFinalUsdNeto` (number), `equityNeto` (number, in COP), and `impuestos` (object) with sub-fields `rentaEtf` (USD), `gananciaVivienda` (COP), `costosVenta` (COP), `refundAfcTotalCop` (COP). All MUST be defined finite numbers regardless of toggle state.

#### Scenario: All fields present

- GIVEN any valid input
- WHEN simulate completes
- THEN `result.etfFinalUsdNeto`, `result.equityNeto`, and the four sub-fields of `result.impuestos` MUST all be defined finite numbers
