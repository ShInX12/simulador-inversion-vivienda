# ¿Comprar o arrendar + invertir? — Calculadora financiera

Una calculadora interactiva que compara, en términos de patrimonio neto a 20 años, la decisión de **comprar vivienda con hipoteca** contra **arrendar e invertir** en un ETF, adaptada al mercado colombiano (FNA, banca comercial, VIS).

No es asesoría financiera. Es una herramienta para entender la sensibilidad de la decisión a los supuestos que ingresas.

---

## ¿Cómo correrla?

La app no tiene build step ni dependencias en producción, pero como usa ES Modules (`<script type="module">`) **necesita ser servida por HTTP** — los browsers son estrictos con módulos cargados desde `file://`.

```bash
# Python 3 (preinstalado en macOS y la mayoría de Linux)
python3 -m http.server 8080

# Node (si lo tenés)
npx serve

# Luego abre: http://localhost:8080
```

Cualquier servidor estático funciona — VS Code Live Server, `php -S`, etc.

---

## Stack

**Producción** (lo que carga el browser):
- **HTML/CSS/JS vanilla** — sin frameworks, sin build step.
- **ES Modules nativos** — `<script type="module">` directo.
- **Chart.js 4.4** — cargado por CDN para los gráficos.
- **Google Fonts** — Fraunces (serif display), Manrope (sans), JetBrains Mono.

**Desarrollo** (solo si vas a correr tests):
- **Vitest** — test runner. `npm install` para activarlo.

La decisión de no usar React/Vue/build tools en producción es deliberada: cualquier persona puede leer y modificar el código sin instalar nada. Vitest está aislado en `devDependencies` — no afecta lo que carga el browser.

---

## Cómo correr los tests

Los tests cubren la matemática pura de `calculator.js` (todas las funciones + las dos capabilities especificadas), los formatters de `ui.js`, regression guards de bugs ya cazados, y la lógica de impuestos. Hay **106 tests** en 15 archivos, corren en menos de medio segundo.

```bash
# Una vez (solo la primera vez):
npm install

# Correr todos los tests:
npm test

# Watch mode (re-corre automáticamente al cambiar archivos):
npm run test:watch
```

Si agregás features nuevas, conviene escribir el test ANTES (TDD) — la separación de capas (matemática pura en `calculator.js`) hace que sea muy directo. Ver `tests/calculator.test.js` para ejemplos.

---

## Estructura de archivos

```
calculadora-vivienda/
├── index.html              # Estructura del documento
├── styles/
│   └── main.css            # Todos los estilos (theming + layout + componentes)
├── js/
│   ├── calculator.js       # Lógica financiera pura, sin DOM (ESM)
│   ├── ui.js               # Lectura de inputs, formato, actualización del DOM (ESM)
│   ├── charts.js           # Setup y actualización de Chart.js (ESM)
│   └── app.js              # Entry point: conecta todo (ESM)
├── tests/                          # 106 tests en 15 archivos
│   ├── admin-split.test.js         # Split de admin comprador vs arrendatario
│   ├── calculator.test.js          # simulate() + utility functions
│   ├── compound-interest.test.js   # Series de interés compuesto del ETF
│   ├── contribution.test.js        # Aporte mensual y step-up anual
│   ├── crossover-bug.test.js       # Regression guard del cost-crossover
│   ├── crossover-metrics.test.js   # Patrimonio crossover
│   ├── formatters.test.js          # fmtCOP, fmtCOPCuota, fmtPct, fmtUSD
│   ├── goal-seek.test.js           # goalSeek() y breakevens()
│   ├── insurance.test.js           # Seguros de vida e incendio
│   ├── presets.test.js             # Presets de escenario
│   ├── salary-burden.test.js       # Carga financiera sobre el salario
│   ├── schedule.test.js            # amortizationSchedule() y scheduleTotals()
│   ├── scorecard.test.js           # Métricas del scorecard
│   ├── spending.test.js            # Gasto no recuperable acumulado
│   └── tax-model.test.js           # Modelo de impuestos + AFC
├── docs/
│   ├── ARCHITECTURE.md     # Cómo se conectan los módulos y por qué
│   ├── EXTENDING.md        # Cómo agregar variables, charts, presets
│   └── FORMULAS.md         # Las matemáticas detrás de la simulación
├── package.json            # devDependencies: vitest
├── vitest.config.js        # Config mínima (Node env, tests/**/*.test.js)
└── README.md               # Este archivo
```

Las responsabilidades están separadas por una razón: te permite modificar una capa sin tocar las otras. La lógica financiera no sabe que existe el DOM. Los charts no saben de dónde vienen los datos. Esto hace la app testeable y extensible.

---

## Variables que considera

### Vivienda y arriendo

| Variable | Default | Rango | Notas |
|---|---|---|---|
| Precio vivienda | $250M COP | $100M–$800M | |
| Cuota inicial | 20% | 0–40% | FNA No VIS pide 10%, banca 20–30% |
| Costos escrituración | 5.5% | 0–10% | Notaría, registro, beneficencia |
| Apreciación anual vivienda | 4.5% | 0–10% | |
| Arriendo equivalente | $1.6M/mes | $0.5M–$6M | |
| Crecimiento arriendo (IPC) | 5% | 0–12% | Por ley no puede superar el IPC |
| Admin/predial (comprar) | $380k/mes | $0–$1.5M | Admin + predial del propietario (el seguro va aparte) |
| Admin (arrendar) | $190k/mes | $0–$1.5M | Lo que paga el arrendatario (sin predial ni seguro estructural) |

### Hipoteca

| Variable | Default | Rango | Notas |
|---|---|---|---|
| Tasa hipoteca EA | 10% | 4–18% | Step 0.05% |
| Plazo | 20 años | 5–30 años | Pesos hasta 20, UVR hasta 30 |
| Seguro de vida (mensual) | 0.05% | 0–0.2% | % del **saldo pendiente** → decrece a medida que pagás capital |
| Seguro de incendio (mensual) | 0.045% | 0–0.2% | % del **valor de la vivienda** → fijo (no decrece) |

### Inversión alternativa (ETF + FX)

| Variable | Default | Rango | Notas |
|---|---|---|---|
| Modo de inversión | Aporte fijo | Aporte fijo / Diferencia | Selector de tabs en la UI |
| Retorno ETF en USD | 8% | 0–18% | CSPX.L nominal histórico ~10% USD; 8% es conservador forward-looking |
| Tasa COP/USD inicial | $4,200 | $3,000–$6,000 | Cotización al día cero |
| Devaluación anual COP/USD | 3% | 0–8% | Promedio histórico colombiano ~3-4% |
| Aporte mensual al ETF (USD) | $250 | $0–$1,000 | Solo aplica en modo "Aporte fijo" |
| Aumento anual del aporte | 8% | 0–20% | Sube cada 12 meses (refleja ajuste salarial) |
| Invertir cuota inicial al ETF | ON | ON / OFF | Si OFF, el ETF arranca en $0 USD |

### Impuestos y costos al cierre

| Variable | Default | Rango | Notas |
|---|---|---|---|
| Aplicar impuestos al cierre | OFF | ON / OFF | Si ON, "Diferencia final" es post-tax (impuestos colombianos aplicados al liquidar) |
| Tarifa marginal de renta | 33% | 0–40% | Aplica al rendimiento del ETF al liquidar y al refund AFC |
| Ganancia ocasional vivienda | 10% | 0–20% | Sobre la utilidad al vender la vivienda |
| Costos de venta vivienda | 5% | 0–10% | Comisión inmobiliaria + legales |
| Vivienda primera (exención) | ON | ON / OFF | Aplica exención de 7,500 UVT (~$382M en 2026, indexado a IPC) |
| Aporte AFC mensual | $0 | $0–$3M | Aporte mensual a Cuenta AFC. 0 = no aplico el beneficio |

### Tu salario

| Variable | Default | Rango | Notas |
|---|---|---|---|
| Salario mensual | $5M/mes | $1M–$30M | Solo para la gráfica de carga financiera — **no afecta la Diferencia final** |
| Crecimiento anual del salario | 5% | 0–15% | Si crece igual que el IPC, la carga del arriendo se mantiene; la cuota fija se aligera |

---

## Modos de inversión

La calculadora ofrece dos formas de modelar cuánto invierte el arrendatario en el ETF mes a mes. Se elige con tabs arriba del panel de controles.

### Diferencia

El **modelo académico**. Cada mes, el arrendatario invierte exactamente la diferencia entre el costo de comprar (cuota + admin) y el costo de arrendar (arriendo + admin parcial), siempre que esa diferencia sea positiva. Asume disciplina perfecta: si comprar fuera más barato un mes, no aporta nada.

Es útil como **techo teórico** — la respuesta a la pregunta "con el mismo flujo de caja, ¿qué decisión maximiza el patrimonio?".

### Aporte fijo (default)

El **modelo realista**. El arrendatario se compromete a invertir un monto fijo mensual (`Aporte mensual al ETF`), independientemente de si comprar saldría más caro o más barato ese mes. El aporte se ajusta una vez al año por el `Aumento anual del aporte`, replicando un ajuste salarial típico.

Es útil para **planificar tu plan real de ahorro** — la respuesta a "si me comprometo con X COP/mes, ¿qué decisión me deja mejor en 20 años?".

### Cuándo usar cada uno

- Querés ver el comparativo más justo en términos académicos → **Diferencia**.
- Querés ver qué pasa con tu plan real de ahorro → **Aporte fijo**.
- En cualquier modo, el toggle `Invertir cuota inicial al ETF` controla si el cash que te ahorrás de no comprar (cuota inicial + escrituración) entra al ETF el día cero. Si está apagado, el ETF arranca en $0 y solo crece con los aportes mensuales.

---

## Outputs que produce

La sección superior es un **scorecard comparativo** que responde la pregunta de frente, en tres partes:

### Veredicto

Un banner que dice quién gana y por cuánto: **Diferencia final** = patrimonio compra menos patrimonio arriendo+ETF al cierre del plazo. **Por defecto post-tax** (asume liquidación al final con impuestos colombianos). El toggle "Aplicar impuestos al cierre" lo cambia a la versión bruta. El banner es verde si gana comprar, coral si gana arrendar.

### Scorecard (Comprar vs Arrendar + ETF, lado a lado)

| Fila | Comprar | Arrendar + ETF |
|---|---|---|
| **Patrimonio final** | Equity neto de la vivienda | ETF en COP (neto de impuestos) |
| **Plata perdida** | Intereses + admin + escrituración (sunk) | Arriendo + admin parcial (sunk) |
| **Entrada** | Cuota inicial + escrituración | $0 |
| **Mensual inicial** | Cuota | Arriendo |

### Tira de detalles

Datos de apoyo de un solo lado o de timing: **Intereses al banco**, **ETF final (USD)**, y los tres cruces:
- **Arriendo > cuota** — año en que el costo mensual del arriendo supera la cuota mensual. *Cost crossover.*
- **Cruce de patrimonio** — año en que el patrimonio de un escenario supera al del otro (equity vs ETF). *Wealth crossover.*
- **Cruce de gasto** — año en que el gasto no recuperable acumulado de arrendar supera al de comprar.

(Los tres cruces son conceptualmente distintos — ver §7 y §13 de `FORMULAS.md`.)

Más siete gráficos:

1. **Patrimonio neto a lo largo del tiempo** (`Cómo evoluciona tu riqueza`) — equity de la vivienda vs ETF en COP. La línea principal.
2. **Composición del pago anual** — cuánto va a intereses vs capital cada año.
3. **Costo mensual: comprar vs arrendar** — cuota + admin vs arriendo + admin parcial; cuándo se cruzan.
4. **Plata perdida en cada escenario** — gasto NO recuperable acumulado (comprar: intereses + admin + escrituración; arrendar: arriendo + admin parcial), con marcador del cruce. No cuenta el capital ni la cuota inicial, que sí son recuperables al vender.
5. **Aporte anual al ETF (USD)** — cuánto inviertes al ETF cada año; barras escalonadas en modo "Aporte fijo", variables en "Diferencia". El tooltip muestra el anual y el mensual.
6. **Interés compuesto generado por el ETF (USD)** — dos líneas: el valor del portafolio con interés compuesto vs los aportes acumulados sin crecimiento. La brecha entre ambas es el interés compuesto generado.
7. **Carga financiera (% del salario)** — costo mensual total de comprar vs arrendar como porcentaje de tu salario a lo largo del tiempo. Muestra cómo la cuota fija se aligera si tu salario crece.

---

## Presets disponibles

Son **escenarios** que configuran varias variables coherentes de una vez (no solo la tasa). Se eligen en "Configuración rápida".

| Preset | Qué setea |
|---|---|
| **Joven FNA** | Tasa 8.8% · cuota inicial 10% · plazo 30 años (afiliado FNA, plazo largo) |
| **Banca tradicional** | Tasa 12.5% · cuota inicial 30% · plazo 20 años |
| **Inversionista disciplinado** | Modo "Aporte fijo" · aporte $400 USD/mes · aumento 10% · retorno ETF 9% |
| **Conservador** | Apreciación 3% · retorno ETF 6% · devaluación 2% (supuestos cautos) |

Las tasas de crédito vienen de la cartelera del FNA y promedios de banca comercial. Ajustá los valores a tu caso real.

---

## Para extender la calculadora

Lee:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — cómo está organizado el código y por qué.
- [`docs/EXTENDING.md`](docs/EXTENDING.md) — guías paso a paso para agregar inputs, charts, presets, escenarios.
- [`docs/FORMULAS.md`](docs/FORMULAS.md) — las fórmulas financieras y supuestos del modelo.

Cada uno está pensado para que puedas pegarlo en una conversación con Claude y pedir cambios concretos.

---

## Limitaciones conocidas del modelo

### Lo que SÍ modela

- Impuestos al cierre (renta marginal sobre rendimientos del ETF, ganancia ocasional al vender vivienda con exención de 7,500 UVT para vivienda primera, costos de venta)
- Beneficio tributario AFC al arrendar (refund anual al ETF)
- ETF en USD con FX engine determinista (devaluación anual configurable)
- Step-up anual del aporte mensual (refleja ajuste salarial)

### Lo que NO modela explícitamente

- **Costos de mantenimiento de la vivienda** distintos del admin/predial (reparaciones, mejoras). Suelen ser 1–2% del valor anual.
- **Volatilidad de FX y del ETF**: el modelo es determinista — usa devaluación constante (3% por defecto) y retorno USD constante (8% por defecto). En realidad CSPX.L tiene drawdowns del 20–40% (2008, 2020, 2022), y COP/USD puede saltar 25%+ en un año (2014–15, 2020). Para modelar esto se necesitaría Monte Carlo con bandas de confianza.
- **Inflación específica del salario**: la cuota es nominal y fija. Si el ingreso del usuario crece menos que el IPC, la cuota relativa se hace más cara.
- **Tasas en UVR**: el modelo asume tasa fija en pesos. Las hipotecas en UVR tienen su propia mecánica (tasa real + ajuste UVR).
- **Saldo de la AFC**: solo se modela el refund anual al ETF. El saldo de la cuenta AFC (que también es del usuario) no se trackea — se asume que vuelve al usuario fuera del horizonte de comparación.
- **30% cap del aporte AFC vs ingreso**: la ley colombiana topa el aporte AFC al 30% del ingreso laboral. El modelo confía en el input — el usuario es responsable de no exceder el cap.
- **Costo de oportunidad de la cuota inicial** si pudiera invertirse en algo más conservador (no ETF). El modelo solo compara compra vs ETF; otras alternativas (CDT, fondos de pensión voluntarios, etc.) no entran.

Las omisiones restantes son extensiones naturales — el patrón está documentado en `EXTENDING.md` y el workflow TDD en `tests/` permite agregarlas con regression coverage automática.

---

## Licencia

Uso personal y educativo libre. No es asesoría financiera profesional.
