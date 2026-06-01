# ETF Investment Mode Specification

## Purpose

Defines how the renter's ETF portfolio is computed in the buy-vs-rent simulation. Two configurable mechanisms drive growth: a one-time seed of the cash that would have been used for down payment + closing, and monthly contributions whose amount depends on the selected mode.

## Requirements

### Requirement: Investment Mode Selection

The system MUST support exactly two modes through the input field `modo`: `diferencia` and `aporte-fijo`. The default at first load MUST be `aporte-fijo`. Changing the mode MUST trigger an immediate recompute and toggle which mode-specific inputs are visible.

#### Scenario: First load

- GIVEN no prior state
- WHEN the page renders
- THEN the active tab MUST be "Aporte fijo"
- AND only inputs relevant to `aporte-fijo` MUST be visible alongside the always-visible inputs

#### Scenario: Switching tabs

- GIVEN the active mode is `diferencia`
- WHEN the user clicks the `aporte-fijo` tab
- THEN the simulation MUST recompute under the new mode
- AND the visible inputs MUST update to match the new mode

### Requirement: Diferencia Mode Behavior

When `modo='diferencia'`, every month, before applying the ETF return, the system MUST add `max(0, costoCompra - costoArriendo)` to the ETF balance. Results MUST be identical to the calculator's behavior prior to this change.

#### Scenario: Buying costs more than renting

- GIVEN `modo='diferencia'`, in month m `costoCompra=2_500_000` and `costoArriendo=1_800_000`
- WHEN month m processes
- THEN the ETF balance MUST gain exactly 700_000 COP before that month's return is applied

#### Scenario: Renting costs more than buying

- GIVEN `modo='diferencia'`, in month m `costoArriendo > costoCompra`
- WHEN month m processes
- THEN the ETF MUST receive zero contribution that month

### Requirement: Aporte Fijo Mode Behavior

When `modo='aporte-fijo'`, every month, before applying the ETF return, the system MUST add the current `aporteMensual` value to the ETF balance, regardless of `costoCompra - costoArriendo`. At months 13, 25, 37, … the system MUST multiply the running `aporteMensual` by `(1 + aporteIncrementoPct / 100)`. Months 1–12 MUST use the user-entered value unchanged. The contribution MUST apply ONLY in the renter scenario; the buyer scenario MUST NOT receive any ETF contribution.

#### Scenario: First-year months

- GIVEN `modo='aporte-fijo'`, `aporteMensual=500_000`, `aporteIncrementoPct=8`
- WHEN month 6 processes
- THEN the ETF MUST gain exactly 500_000 COP before that month's return

#### Scenario: Step-up at month 13

- GIVEN `modo='aporte-fijo'`, `aporteMensual=500_000`, `aporteIncrementoPct=8`
- WHEN month 13 processes
- THEN the ETF MUST gain exactly 540_000 COP before that month's return

#### Scenario: Zero contribution

- GIVEN `modo='aporte-fijo'`, `aporteMensual=0`, `aporteIncrementoPct=0`
- WHEN any month processes
- THEN the ETF growth MUST equal pure compounding of the prior balance with no contribution added

### Requirement: Initial Cash Investment Toggle

The system MUST expose `invertirCashInicial` (boolean), default `true`, applying to BOTH modes. When `true`, the renter ETF MUST be seeded at month 0 with `cashInicial = cuotaInicial + escrituracion`. When `false`, the ETF MUST start at zero.

#### Scenario: Toggle ON

- GIVEN `invertirCashInicial=true` and `cashInicial=39_000_000`
- WHEN the simulation initializes
- THEN the ETF month-0 balance MUST be exactly 39_000_000 COP

#### Scenario: Toggle OFF

- GIVEN `invertirCashInicial=false`
- WHEN the simulation initializes
- THEN the ETF month-0 balance MUST be exactly 0

### Requirement: Backward Compatibility (Regression Check)

When `modo='diferencia'` and `invertirCashInicial=true`, the system MUST produce numerical results identical to the pre-change calculator for the same set of inputs. This requirement governs the regression validation step.

#### Scenario: Default inputs under diferencia mode

- GIVEN the pre-change default inputs (precio=$250M, ci=10%, esc=5.5%, apr=4.5%, tasa=10%, plazo=20, arr=$1.6M, ipc=5%, adm=$380k, etf=10%)
- AND `modo='diferencia'`, `invertirCashInicial=true`
- WHEN the simulation runs
- THEN final difference, crossover year, and every yearly snapshot MUST match the pre-change baseline within rounding tolerance
