# Delta for etf-investment-mode

## ADDED Requirements

### Requirement: FX Rate Engine

The system MUST maintain a monthly COP/USD exchange rate that compounds from a user-set initial value (`tasaCopUsdInicial`) at a monthly devaluation rate derived from `devaluacionAnualPct`. The monthly devaluation rate MUST be computed as `(1 + devaluacionAnualPct/100)^(1/12) − 1`. The rate at month `m` MUST be `tasa_m = tasaCopUsdInicial × (1 + devaluacionMensual)^m`. At `m=0`, `tasa_0` MUST equal `tasaCopUsdInicial` exactly.

#### Scenario: Initial rate

- GIVEN `tasaCopUsdInicial=4200`, `devaluacionAnualPct=3`
- WHEN month 0 is queried
- THEN `tasa_0` MUST equal exactly 4200

#### Scenario: Constant FX (zero devaluation)

- GIVEN `tasaCopUsdInicial=4200`, `devaluacionAnualPct=0`
- WHEN any month from 1 to 240 is queried
- THEN `tasa_m` MUST equal exactly 4200

#### Scenario: Compounded devaluation across 20 years

- GIVEN `tasaCopUsdInicial=4200`, `devaluacionAnualPct=3`
- WHEN month 240 (year 20) is queried
- THEN `tasa_240` MUST equal `4200 × (1.03)^20 ≈ 7588.94` within 0.5% tolerance

### Requirement: ETF USD Reporting

The system MUST expose the final ETF balance in USD as `result.etfFinalUsd`. The existing yearly series `yearly[a].etf` MUST continue to report the COP equivalent at that year's rate (`etfUsd_{m=12a} × tasa_{m=12a}`), preserving the chart contract.

#### Scenario: etfFinalUsd on result

- GIVEN any valid simulation input
- WHEN the simulation completes
- THEN `result.etfFinalUsd` MUST be present and equal `etfUsd` at month 240
- AND `result.yearly[20].etf` MUST equal `etfUsd_{m=240} × tasa_{m=240}` in COP

## MODIFIED Requirements

### Requirement: Diferencia Mode Behavior

When `modo='diferencia'`, every month, before applying the ETF return, the system MUST compute the COP cost difference `dif = max(0, costoCompra − costoArriendo)` and convert it to USD at the current month's rate `tasa_m`. The resulting USD amount MUST be added to the renter's USD-denominated ETF balance.
(Previously: the COP difference was added directly to a COP-denominated ETF balance; there was no FX conversion.)

#### Scenario: Buying costs more than renting

- GIVEN `modo='diferencia'`, in month m `costoCompra=2_500_000`, `costoArriendo=1_800_000`, `tasa_m=4200`
- WHEN month m processes
- THEN the ETF USD balance MUST gain exactly `700_000 / 4200 ≈ 166.667` USD before that month's return

#### Scenario: Renting costs more than buying

- GIVEN `modo='diferencia'`, in month m `costoArriendo > costoCompra`
- WHEN month m processes
- THEN the ETF MUST receive zero USD contribution that month

### Requirement: Aporte Fijo Mode Behavior

When `modo='aporte-fijo'`, every month, before applying the ETF return, the system MUST add the current `aporteActualUsd` value (in USD) directly to the renter's USD-denominated ETF balance, without FX conversion. At months 13, 25, 37, … the system MUST multiply `aporteActualUsd` by `(1 + aporteIncrementoPct/100)`. Months 1–12 MUST use the user-entered `aporteMensualUsd` unchanged. The contribution MUST apply ONLY in the renter scenario.
(Previously: the contribution was a COP amount added to a COP-denominated ETF balance.)

#### Scenario: First-year months (USD)

- GIVEN `modo='aporte-fijo'`, `aporteMensualUsd=250`, `aporteIncrementoPct=8`
- WHEN month 6 processes
- THEN the ETF MUST gain exactly 250 USD before that month's return

#### Scenario: Step-up at month 13 (USD)

- GIVEN `modo='aporte-fijo'`, `aporteMensualUsd=250`, `aporteIncrementoPct=8`
- WHEN month 13 processes
- THEN the ETF MUST gain exactly 270 USD before that month's return

#### Scenario: Zero contribution

- GIVEN `modo='aporte-fijo'`, `aporteMensualUsd=0`, `aporteIncrementoPct=0`
- WHEN any month processes
- THEN the ETF growth MUST equal pure compounding of the prior USD balance with no contribution added

### Requirement: Initial Cash Investment Toggle

The system MUST expose `invertirCashInicial` (boolean), default `true`, applying to BOTH modes. When `true`, the renter ETF MUST be seeded at month 0 with `cashInicial / tasaCopUsdInicial` USD (i.e., the COP cashInicial converted to USD at the month-0 rate). When `false`, the ETF MUST start at zero USD.
(Previously: ON seeded the COP-denominated ETF directly with `cashInicial` COP; there was no FX conversion.)

#### Scenario: Toggle ON with USD seeding

- GIVEN `invertirCashInicial=true`, `cashInicial=39_000_000`, `tasaCopUsdInicial=4200`
- WHEN the simulation initializes
- THEN the ETF month-0 USD balance MUST equal `39_000_000 / 4200 ≈ 9285.71` USD

#### Scenario: Toggle OFF

- GIVEN `invertirCashInicial=false`
- WHEN the simulation initializes
- THEN the ETF month-0 USD balance MUST be exactly 0

## REMOVED Requirements

### Requirement: Backward Compatibility (Regression Check)

(Reason: the regression invariant from the `etf-dual-mode` change asserted that `modo='diferencia' + invertirCashInicial=true` produced numbers identical to the pre-`etf-dual-mode` calculator. With the new USD/FX engine, the ETF math fundamentally changes — the magic 10% COP return is replaced by USD return + devaluation. The old invariant cannot hold and would be misleading. It is replaced by the new internal-consistency scenarios in the FX Rate Engine, Diferencia, Aporte Fijo, and Cash Toggle requirements above.)
