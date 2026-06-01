# Las fórmulas

Las matemáticas que corren bajo el capó. Si vas a modificar `calculator.js`, lee esto primero.

---

## 1. Conversión de tasa efectiva anual a mensual

Una tasa **efectiva anual (EA)** del 10% significa que $100 se vuelven $110 al cabo de un año compuesto continuamente. Para convertirla a una tasa mensual equivalente:

$$
i_m = (1 + i_{EA})^{1/12} - 1
$$

Ejemplo: 10% EA → `(1.10)^(1/12) − 1 = 0.7974%` mensual.

**No** es lo mismo que dividir entre 12 (eso sería la tasa nominal anual capitalizable mensualmente, que es un concepto distinto).

En el código: `eaToMonthly(eaPct)`.

---

## 2. Cuota mensual fija (sistema francés)

Es la fórmula clásica de amortización: la cuota es la misma todos los meses, pero la composición entre intereses y capital cambia.

$$
\text{cuota} = P \cdot \frac{i_m}{1 - (1 + i_m)^{-n}}
$$

donde:
- `P` = principal (monto prestado)
- `i_m` = tasa de interés mensual
- `n` = número total de cuotas (meses)

**Ejemplo:** $225M COP a 10% EA por 20 años.
- `i_m = 0.7974%`
- `n = 240`
- `cuota = 225M × 0.007974 / (1 − 1.007974^(−240)) = $2.107M COP`

En el código: `monthlyPayment(principal, rateEA, years)`.

---

## 3. Amortización: cuánto va a intereses vs capital cada mes

En cada mes, primero calculas los intereses sobre el saldo pendiente. El resto de la cuota es amortización al capital.

$$
\text{intereses}_m = \text{saldo}_{m-1} \cdot i_m
$$
$$
\text{capital}_m = \text{cuota} - \text{intereses}_m
$$
$$
\text{saldo}_m = \text{saldo}_{m-1} - \text{capital}_m
$$

**Por qué es importante:** en los primeros años, la mayor parte de la cuota va a intereses (el saldo es alto). Al final, casi todo va a capital. Esto se llama "frontloading" del interés.

**Ejemplo numérico** ($225M, 10% EA, 20 años):

| Mes | Saldo inicial | Intereses | Capital | Saldo final |
|---:|---:|---:|---:|---:|
| 1 | $225,000,000 | $1,794,179 | $313,260 | $224,686,740 |
| 2 | $224,686,740 | $1,791,681 | $315,758 | $224,370,982 |
| ... | | | | |
| 240 | $2,089,991 | $16,664 | $2,090,775 | ≈ $0 |

Por eso, **vender la vivienda en los primeros 5–7 años casi no te da equity**: pagaste intereses, no capital.

---

## 4. Crecimiento del arriendo (anualidad creciente)

El arriendo crece con el IPC (por ley en Colombia, no puede superar el IPC del año anterior). En el modelo asumimos un crecimiento mensual compuesto:

$$
\text{arriendo}_m = \text{arriendo}_0 \cdot (1 + g_m)^m
$$

donde `g_m = (1 + IPC_{anual})^{1/12} − 1`.

Esto produce el efecto característico: en los primeros años el arriendo es más barato que la cuota, pero al cabo de varios años (típicamente 5–10) el arriendo supera la cuota y de ahí en adelante crecer cada vez más.

---

## 5. Interés compuesto del ETF (modelo USD/FX)

El ETF (CSPX.L y similares) cotiza en USD, no en COP. El modelo refleja esto: el portafolio del arrendatario **vive en USD durante toda la simulación**, y solo se reconvierte a COP en los snapshots para poder compararlo con el equity de la vivienda (que sí está en COP).

### Crecimiento mensual del ETF en USD

$$
\text{ETF}^{USD}_m = (\text{ETF}^{USD}_{m-1} + \text{aporte}^{USD}_m) \cdot (1 + r^{USD}_m)
$$

donde `r^USD_m = (1 + retornoEtfUsdPct/100)^(1/12) − 1`.

### El aporte mensual en USD depende del modo

- **`diferencia`** (modelo académico): la diferencia se calcula en COP y se convierte a USD a la tasa del mes:
  $$
  \text{aporte}^{USD}_m = \frac{\max(0,\, \text{costoCompra}_m - \text{costoArriendo}_m)}{\text{tasa}^{COP/USD}_m}
  $$
  Si la diferencia es negativa, no hay aporte ese mes.

- **`aporte-fijo`** (modelo realista): el usuario aporta un monto fijo en USD, independiente de costoCompra/costoArriendo. Al inicio de cada año cumplido (m = 13, 25, 37, ...) el aporte se incrementa:
  $$
  \text{aporteActualUsd} \mathrel{*}= 1 + \text{aporteIncrementoPct}/100
  $$
  Refleja el ajuste salarial típico — la mayoría sube su aporte USD una vez al año.

### Aporte inicial (cashInicial seed)

Si el toggle `invertirCashInicial` está ON (default), el cash que se ahorra al no comprar (cuota inicial + escrituración, en COP) se convierte a USD a la tasa del **mes 0** y se siembra en el ETF el día cero:

$$
\text{ETF}^{USD}_0 = \text{cashInicial} / \text{tasaCopUsdInicial}
$$

Si está OFF, el ETF arranca en $0 USD.

### Reconvertir a COP para comparar

En cada snapshot anual, el ETF en COP equivalente se calcula con la tasa del mes correspondiente:

$$
\text{ETF}^{COP}_m = \text{ETF}^{USD}_m \cdot \text{tasa}^{COP/USD}_m
$$

La tasa COP/USD evoluciona en el tiempo — ver §11 (FX rate engine).

---

## 6. Apreciación de la vivienda

Asumida lineal compuesta anual:

$$
\text{valor}_n = \text{precio}_0 \cdot (1 + a)^n
$$

donde `a` es la tasa de apreciación anual y `n` es el año.

**Equity** del propietario en el año `n`:

$$
\text{equity}_n = \text{valor}_n - \text{saldo hipoteca}_n
$$

Una vez pagada la hipoteca, equity = valor de la vivienda.

---

## 7. La diferencia final: medida única de "quién gana"

Al cabo de `N` años:

$$
\Delta = \text{equity vivienda} - \text{portafolio ETF}
$$

- Si `Δ > 0`, la compra superó al arriendo + inversión.
- Si `Δ < 0`, arrendar e invertir superó a la compra.

**Caveat importante:** este número no compara "lujos" iguales. El comprador termina con una vivienda paid-off (puede vivir gratis). El arrendatario tiene cash en ETF pero sigue pagando arriendo. En un análisis riguroso, deberías:

1. Restar al ETF del arrendatario el valor presente de los arriendos futuros que aún tendrá que pagar, **o**
2. Asumir que el comprador podría vender su vivienda y entrar a un sistema de arriendo, igualando los dos escenarios al final.

El modelo actual usa la versión simplificada (1 omitido). Para casi todos los casos prácticos en Colombia, este simplificador favorece levemente al arrendatario, lo que hace el análisis más conservador para la decisión de comprar.

---

## 8. Año del cruce (crossover)

Es el primer año en que el costo mensual del arriendo (ya creciendo) supera el costo mensual fijo de la cuota. Antes de ese año, arrendar es más barato mes a mes. Después, comprar lo es.

Es un dato útil para entender la "psicología" del trade-off: durante los primeros años pagarás más viviendo en lo propio que arrendando. Después se invierte.

---

## 9. Supuestos del modelo — qué SÍ y qué NO está modelado

### Sí está modelado (post 2026)

- **Impuestos al cierre** (ver §12): renta marginal sobre rendimientos ETF, ganancia ocasional vivienda con exención 7,500 UVT (vivienda primera), costos de venta vivienda
- **Beneficio AFC al arrendar** (ver §12): refund anual al ETF
- **ETF en USD con FX engine** (ver §11): devaluación COP/USD compuesta mensualmente

### NO está modelado

- **Mantenimiento de la vivienda** (reparaciones, mejoras): no modelado. Suele ser 1–2% del valor anual.
- **Volatilidad** del ETF y del COP/USD: el modelo asume rendimientos y devaluación lisos. En realidad CSPX.L tiene drawdowns del 20–40% y COP/USD salta del 25%+ en años de crisis. Modelar esto = Monte Carlo, scope distinto.
- **Inflación específica del salario**: cuota nominal fija, sin tracking del ingreso del usuario.
- **Tasas en UVR**: el modelo asume tasa fija en pesos. UVR tiene su propia mecánica (tasa real + ajuste UVR).
- **Saldo de AFC**: solo se modela el refund anual. La AFC balance que el usuario acumuló no se trackea — se asume que retorna al usuario fuera del horizonte de comparación.
- **Cap del 30% del ingreso para aporte AFC**: la ley topa el aporte; el modelo confía en el input.

Para tener todas estas limitaciones en mente al leer cualquier resultado de la calculadora.

---

## 10. Sanity checks recomendados

Si modificas `calculator.js`, valida con estos casos:

| Input | Output esperado |
|---|---|
| $100M COP, 10% EA, 20 años | Cuota ≈ $937k mensual, intereses totales ≈ $125M |
| $200M COP, 8% EA, 15 años | Cuota = **$1,879,212** (~$1.88M) mensual |
| Tasa 0%, $120M, 10 años | Cuota = $1M exacto (sin intereses), intereses = $0 |
| Apreciación 0%, plazo 20 | Equity final = precio inicial − $0 = precio (cuando saldo = 0) |

> **Nota histórica**: hasta 2026 esta doc decía `$1.86M` para el segundo sanity. La fórmula exacta con EA→mensual da `$1,879,212` (~1% off de la aproximación anterior). Los tests automatizados (`tests/calculator.test.js`) assertan el valor correcto.

Si tras tu cambio estos números se rompen, hay un bug. Mejor aún: los tests en `tests/calculator.test.js` los validan automáticamente — corré `npm test` antes y después de cambiar `calculator.js`.

---

## 11. Motor de tasa COP/USD (FX rate engine)

El modelo asume que la tasa de cambio COP/USD se mueve **deterministamente** con una devaluación anual constante, compuesta mensualmente. Es una simplificación — en la realidad la tasa salta por shocks (crisis, política), pero como decisión de modelado es razonable para horizontes largos.

### Composición mensual de la devaluación

$$
\text{tasa}^{COP/USD}_m = \text{tasaCopUsdInicial} \cdot (1 + \text{devalMensual})^m
$$

donde:

$$
\text{devalMensual} = (1 + \text{devaluacionAnualPct}/100)^{1/12} - 1
$$

Mismo patrón que IPC y apreciación de la vivienda — todo se compone mensualmente.

### Defaults y un ejemplo

- `tasaCopUsdInicial = 4200` (COP por USD al día cero)
- `devaluacionAnualPct = 3` (promedio histórico colombiano)

Al mes 240 (año 20):
$$
\text{tasa}_{240} = 4200 \cdot (1.03)^{20} \approx 7588.94
$$

Es decir, en 20 años el peso se habrá devaluado ~80% acumulado bajo el supuesto del 3% anual.

### Cómo se usa en la simulación

- En modo `diferencia`, la diferencia COP del mes se divide por `tasa_m` para convertir a USD antes de entrar al ETF
- El cashInicial se convierte a USD al **mes 0** (a `tasaCopUsdInicial`)
- Para mostrar el ETF en COP en cada snapshot, se reconvierte a `tasa_m` correspondiente

En el código: variable `tasaActual` que se actualiza en el loop con `tasaActual *= 1 + devalMensual`.

---

## 12. Modelo de impuestos al cierre + beneficio AFC

Al final del plazo, la calculadora puede aplicar el modelo fiscal colombiano para que la "Diferencia final" refleje **dinero real en la mano** y no patrimonio bruto. Esto se controla con el toggle `aplicarImpuestos` (default ON).

### Impuesto sobre rendimientos del ETF al liquidar

Cuando el usuario liquida el ETF, paga renta marginal sobre la utilidad:

$$
\text{utilidadEtfUsd} = \max(0,\, \text{etfFinalUsd} - \text{aportadoTotalUsd})
$$
$$
\text{impuestoEtfUsd} = \text{utilidadEtfUsd} \cdot \text{tarifaRentaMarginal}/100
$$
$$
\text{etfFinalUsdNeto} = \text{etfFinalUsd} - \text{impuestoEtfUsd}
$$

`aportadoTotalUsd` es el basis: el seed (cashInicial/tasaInicial), todos los aportes mensuales en USD, y los refunds AFC convertidos a USD. Cualquier ganancia sobre eso es la utilidad gravable.

### Ganancia ocasional al vender vivienda

Con exención de 7,500 UVT (vivienda primera, hold > 2 años):

$$
\text{exencionVivienda} = \begin{cases} 7500 \cdot \text{UVT}_{base} \cdot (1 + \text{ipcPct}/100)^{plazoAnios} & \text{si viviendaPrimera} \\ 0 & \text{si no} \end{cases}
$$

`UVT_base = 51000` (estimado 2026, hardcoded en el código).

$$
\text{utilidadVivienda} = \text{valor}_{final} - \text{precio}_{compra}
$$
$$
\text{utilidadGravable} = \max(0,\, \text{utilidadVivienda} - \text{exencionVivienda})
$$
$$
\text{impuestoGananciaVivienda} = \text{utilidadGravable} \cdot \text{tarifaGananciaViviendaPct}/100
$$

**Ejemplo con defaults**: vivienda $250M apreciando 4.5% anual a 20 años → valor final ≈ $603M → utilidad ≈ $353M. Con IPC 5% por 20 años, la exención crece a `7500 × 51000 × 1.05^20 ≈ $1,014,745,000`. Como exención > utilidad → **impuesto = $0**.

### Costos de venta de la vivienda

$$
\text{costosVenta} = \text{valor}_{final} \cdot \text{costoVentaViviendaPct}/100
$$

Default 5% (comisión inmobiliaria ~3% + legales ~2%).

### Equity neto al cierre

$$
\text{equityNeto} = \max(0,\, \text{valor}_{final} - \text{saldoFinal} - \text{impuestoVivienda} - \text{costosVenta})
$$

### Beneficio AFC al arrendar (refund anual)

Si el arrendatario aporta a una Cuenta AFC, deduce hasta el 30% del ingreso laboral en renta. Eso le devuelve plata cada año (refund), que el modelo asume se reinvierte en el ETF.

Al final de cada año cumplido (m = 12, 24, ..., 240), en el escenario arrendatario:

$$
\text{refundCop} = \text{aporteAfcMensual} \cdot 12 \cdot \text{tarifaRentaMarginal}/100
$$
$$
\text{refundUsd} = \text{refundCop} / \text{tasa}^{COP/USD}_m
$$

Y se hace `etfUsd += refundUsd` y `aportadoTotalUsd += refundUsd` (cuenta como basis).

**Limitación importante**: el modelo NO trackea el saldo de la cuenta AFC en sí — solo el refund. El saldo AFC del usuario eventualmente le vuelve a sus manos, pero no entra en la comparación de este horizonte.

### Diferencia final (post-tax o pre-tax)

$$
\Delta = \begin{cases} \text{equityNeto} - \text{etfFinalUsdNeto} \cdot \text{tasa}_{240} & \text{si aplicarImpuestos = true (default)} \\ \text{equityFinal} - \text{etfFinalCop} & \text{si aplicarImpuestos = false (legacy/bruta)} \end{cases}
$$

El toggle permite comparar las dos lecturas — la realista (post-tax) y la teórica (pre-tax) — sin recalcular nada manualmente.

---

## 13. Campos derivados en `yearly[]`

`simulate()` devuelve `yearly[]`, un array con un snapshot por año (índice 0 = día cero, índices 1–N = fin de cada año). Cada entrada tiene estos campos:

| Campo | Qué es | Gráfica que lo consume |
|---|---|---|
| `anio` | Número de año (0 a plazoAnios) | eje X de todas |
| `equity` | Equity de la vivienda en COP (`valor − saldo`) | Patrimonio |
| `etf` | Valor del ETF en COP equivalente (`etfUsd × tasa_m`) | Patrimonio |
| `cuota` | Cuota mensual fija (constante) | — |
| `arriendoEq` | Arriendo mensual de ese año (crece con IPC) | — |
| `costoCompraMes` | Costo mensual de comprar: `cuota + admin` | Costo mensual |
| `costoArriendoMes` | Costo mensual de arrendar: `arriendo + adminArriendo` | Costo mensual |
| `gastoCompraSunkAcum` | Gasto NO recuperable acumulado al comprar: `escrituración + Σ(intereses + admin)`. NO incluye capital ni cuota inicial | Plata perdida |
| `gastoArriendoAcum` | Gasto acumulado al arrendar: `Σ(arriendo + adminArriendo)` (todo sunk) | Plata perdida |
| `aporteAnualUsd` | Aporte mensual al ETF sumado en el año (USD). NO incluye refund AFC ni seed inicial | Aporte ETF |
| `cargaCompraPct` | `(cuota + admin) / salario × 100` — carga mensual de comprar como % del salario | Carga financiera |
| `cargaArriendoPct` | `(arriendo + adminArriendo) / salario × 100` — carga mensual de arrendar como % del salario | Carga financiera |
| `saldo` | Saldo pendiente de la hipoteca al cierre del año | — |
| `valorVivienda` | Valor de la vivienda apreciado al año | — |
| `intAnio` | Intereses pagados en ese año | Composición del pago |
| `capAnio` | Capital amortizado en ese año | Composición del pago |

**Nota sobre el timing**: los campos que dependen de valores que crecen con IPC (costoCompraMes, costoArriendoMes, cargaCompraPct, cargaArriendoPct) usan el valor del mes del snapshot **después** del ajuste por inflación de ese mes — por eso el salario también se ajusta en el mismo punto del loop, manteniendo la consistencia temporal.

---

## 14. Seguro de la hipoteca (dos componentes)

Las hipotecas en Colombia obligan a dos seguros, que se modelan por separado porque se comportan distinto:

### Seguro de vida deudor

Cubre el saldo de la deuda. Se cobra como **% mensual del saldo pendiente**, así que **decrece** a medida que amortizas capital:

$$
\text{seguroVida}_m = \text{saldo}_{m} \cdot \frac{\text{seguroVidaPct}}{100}
$$

En el primer mes, sobre el saldo inicial (= monto financiado). En el último, casi $0.

### Seguro de incendio/terremoto

Cubre el inmueble. Se cobra como **% mensual del valor inicial de la vivienda**, y es **fijo** (no decrece con el saldo):

$$
\text{seguroIncendio}_m = \text{precio} \cdot \frac{\text{seguroIncendioPct}}{100}
$$

### Total y dónde entra

$$
\text{seguro}_m = \text{seguroVida}_m + \text{seguroIncendio}_m
$$

El seguro es **100% sunk** (no recuperable). Se suma a `costoCompra` cada mes y a `gastoCompraSunkAcum`. El resultado expone `seguroMensualInicial` = el seguro del primer mes (`monto × seguroVidaPct/100 + precio × seguroIncendioPct/100`).

**Validación contra el FNA**: con monto $200M, tasa 9.5% EA, 20 años, la cuota pura del modelo ($1,813,605) + seguro reproduce la "cuota total con seguros" del FNA. Cada banco reparte distinto entre vida (decrece) e incendio (fijo) — por eso ambos son ajustables, para igualar el plan de pagos de tu banco.

**Defaults aproximados**: vida 0.05% del saldo + incendio 0.045% del valor → ~$100k + ~$112.5k iniciales (caso vivienda $250M / monto $200M).
