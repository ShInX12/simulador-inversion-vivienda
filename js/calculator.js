/**
 * calculator.js
 * ================================================================
 * Lógica financiera pura. No toca el DOM. Funciones testeables.
 *
 * Toda la matemática vive aquí. Si quieres agregar una variable nueva
 * (impuestos, valorización por zona, etc.), modifica/extiende `simulate`.
 *
 * EXPORTS: simulate, monthlyPayment, totalInterest, eaToMonthly,
 *          generarRecomendacion, PRESETS
 * ================================================================
 */

/**
 * Convierte una tasa efectiva anual (EA) a tasa mensual equivalente.
 * Fórmula: (1 + EA)^(1/12) − 1
 *
 * @param {number} eaPct  Tasa efectiva anual en porcentaje (ej. 10 = 10%)
 * @returns {number}      Tasa mensual decimal (ej. 0.00797)
 */
function eaToMonthly(eaPct) {
  return Math.pow(1 + eaPct / 100, 1 / 12) - 1;
}

/**
 * Calcula la cuota mensual fija de una hipoteca (sistema francés).
 * Fórmula: cuota = P * r / (1 − (1+r)^(−n))
 *
 * @param {number} principal   Monto del préstamo en COP
 * @param {number} rateEA      Tasa efectiva anual en %
 * @param {number} years       Plazo en años
 * @returns {number}           Cuota mensual en COP
 */
function monthlyPayment(principal, rateEA, years) {
  if (principal <= 0) return 0;
  const r = eaToMonthly(rateEA);
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Calcula el total de intereses pagados durante toda la hipoteca.
 *
 * @param {number} payment   Cuota mensual en COP
 * @param {number} years     Plazo en años
 * @param {number} principal Monto prestado
 * @returns {number}         Total de intereses pagados
 */
function totalInterest(payment, years, principal) {
  return payment * years * 12 - principal;
}

/**
 * Simulación mes a mes que compara COMPRAR vs ARRENDAR + invertir en un ETF en USD.
 *
 * Modelo:
 *   - Comprar: cuota fija (pesos) + admin/predial/seguros que crecen con IPC.
 *     La vivienda se aprecia anualmente. Cada mes amortizamos saldo.
 *   - Arrendar: arriendo y admin crecen con IPC. El ETF vive en USD; cada mes
 *     se aporta una cantidad en USD según el modo:
 *       · 'diferencia'  → max(0, costoCompra − costoArriendo) / tasa_m  (USD)
 *       · 'aporte-fijo' → aporteMensualUsd directo, con step-up anual
 *     La tasa COP/USD compone mensualmente desde tasaCopUsdInicial al
 *     devaluacionAnualPct. El cashInicial (COP) se convierte a USD a la
 *     tasa del mes 0 al sembrar el ETF, SI invertirCashInicial es true.
 *     Para el chart y la diferencia final, etfUsd se reconvierte a COP a
 *     la tasa correspondiente al mes del snapshot.
 *
 * @param {Object}  input
 * @param {number}  input.precio                       Precio vivienda (COP)
 * @param {number}  input.cuotaInicialPct              % cuota inicial
 * @param {number}  input.escrituracionPct             % costos de escrituración
 * @param {number}  input.apreciacionPct               % apreciación anual
 * @param {number}  input.tasaEA                       Tasa hipoteca % EA
 * @param {number}  input.plazoAnios                   Plazo en años
 * @param {number}  input.arriendoInicial              Arriendo mensual inicial (COP)
 * @param {number}  input.ipcPct                       Crecimiento anual arriendo % (IPC)
 * @param {number}  input.adminInicial                 Admin/predial mensual del COMPRADOR (COP)
 * @param {number}  [input.adminArriendoInicial=190000] Admin mensual del ARRENDATARIO (COP)
 * @param {number}  [input.seguroVidaPct=0.05]          Seguro de vida deudor: % mensual del saldo pendiente (decrece)
 * @param {number}  [input.seguroIncendioPct=0.045]     Seguro de incendio: % mensual del valor inicial de la vivienda (fijo)
 * @param {number}  input.retornoEtfUsdPct             Retorno anual ETF en USD (nominal) %
 * @param {string}  [input.modo='diferencia']          'diferencia' | 'aporte-fijo'
 * @param {number}  [input.aporteMensualUsd=0]         Aporte fijo mensual al ETF en USD — solo aporte-fijo
 * @param {number}  [input.aporteIncrementoPct=0]      % que sube el aporte cada 12 meses (sobre USD)
 * @param {boolean} [input.invertirCashInicial=true]   Invertir cashInicial día 0 al ETF (con conversión COP→USD)
 * @param {number}  [input.tasaCopUsdInicial=4200]     Tasa COP/USD al día cero
 * @param {number}  [input.devaluacionAnualPct=3]      Devaluación anual del peso vs USD %
 * @param {boolean} [input.aplicarImpuestos=true]      Si aplica modelo de impuestos al cierre
 * @param {number}  [input.tarifaRentaMarginal=33]     Tarifa marginal renta % (ETF + AFC)
 * @param {number}  [input.tarifaGananciaViviendaPct=10] Tarifa ganancia ocasional vivienda %
 * @param {number}  [input.costoVentaViviendaPct=5]    Costos de venta vivienda % (comisión + legal)
 * @param {boolean} [input.viviendaPrimera=true]       Aplica exención 7500 UVT al vender
 * @param {number}  [input.aporteAfcMensual=0]         Aporte mensual AFC (COP) — beneficio tributario
 * @param {number}  [input.salarioMensual=5e6]         Salario mensual (COP) — solo para carga financiera, no afecta patrimonio
 * @param {number}  [input.crecimientoSalarialPct=5]   Crecimiento anual del salario % — solo para carga financiera
 *
 * @returns {Object} resultado con yearly[] (cada año incluye aporteAnualUsd = aporte mensual al ETF sumado en el año), final, etfFinalUsd, etfFinalUsdNeto, equityNeto, impuestos{}, crossover (año arriendo>cuota), crossoverPatrimonio (año equity↔etf), spendingCrossoverYear (año sunk-arriendo>sunk-compra), diferencia (COP), patrimonioCompraFinal/patrimonioArriendoFinal (COP, netos según aplicarImpuestos), etc.
 */
function simulate(input) {
  const {
    precio,
    cuotaInicialPct,
    escrituracionPct,
    apreciacionPct,
    tasaEA,
    plazoAnios,
    arriendoInicial,
    ipcPct,
    adminInicial,
    adminArriendoInicial = 190000,
    seguroVidaPct = 0.05,
    seguroIncendioPct = 0.045,
    retornoEtfUsdPct,
    modo = 'diferencia',
    aporteMensualUsd = 0,
    aporteIncrementoPct = 0,
    invertirCashInicial = true,
    tasaCopUsdInicial = 4200,
    devaluacionAnualPct = 3,
    // Tax & exit-cost model
    aplicarImpuestos = true,
    tarifaRentaMarginal = 33,
    tarifaGananciaViviendaPct = 10,
    costoVentaViviendaPct = 5,
    viviendaPrimera = true,
    aporteAfcMensual = 0,
    // Carga financiera (visualización — no afecta el cálculo de patrimonio)
    salarioMensual = 5e6,
    crecimientoSalarialPct = 5
  } = input;

  const UVT_BASE_COP = 51000; // 2026 reference value for vivienda primera exemption

  const cuotaInicial = (precio * cuotaInicialPct) / 100;
  const escrituracion = (precio * escrituracionPct) / 100;
  const cashInicial = cuotaInicial + escrituracion;
  const monto = precio - cuotaInicial;
  const meses = plazoAnios * 12;

  const tasaMensual = eaToMonthly(tasaEA);
  const ipcMensual = eaToMonthly(ipcPct);
  const etfUsdMensual = eaToMonthly(retornoEtfUsdPct);
  const devalMensual = eaToMonthly(devaluacionAnualPct);
  const salMensual = eaToMonthly(crecimientoSalarialPct);
  const seguroIncendioM = precio * seguroIncendioPct / 100; // fijo sobre el valor inicial
  const cuota = monthlyPayment(monto, tasaEA, plazoAnios);

  // Estado mes a mes
  let saldo = monto;
  let arriendo = arriendoInicial;
  let admin = adminInicial;
  let adminArriendo = adminArriendoInicial;
  let etfUsd = invertirCashInicial ? cashInicial / tasaCopUsdInicial : 0;
  let aportadoTotalUsd = etfUsd; // basis for ETF tax: includes seed if toggle ON
  let refundAfcTotalCop = 0;
  // Gasto SUNK comprar = escrituración (one-time) + intereses_m + admin_m mes a mes.
  // NO incluye cuota inicial ni capital (van al equity, son recuperables al vender).
  let gastoCompraSunkAcum = escrituracion;
  let gastoArriendoAcum = 0;

  // Series anuales para gráficos
  const yearly = [{
    anio: 0,
    equity: 0,
    etf: etfUsd * tasaCopUsdInicial,
    etfValorUsd: etfUsd,           // valor del portafolio en USD (con interés compuesto)
    aportadoAcumUsd: aportadoTotalUsd, // plata aportada acumulada en USD (sin crecimiento)
    cuota: cuota,
    arriendoEq: arriendoInicial,
    costoCompraMes: cuota + adminInicial + monto * seguroVidaPct / 100 + seguroIncendioM,
    costoArriendoMes: arriendoInicial + adminArriendoInicial,
    gastoCompraSunkAcum: escrituracion,
    gastoArriendoAcum: 0,
    aporteAnualUsd: 0,
    cargaCompraPct: ((cuota + adminInicial) / salarioMensual) * 100,
    cargaArriendoPct: ((arriendoInicial + adminArriendoInicial) / salarioMensual) * 100,
    saldo: monto,
    valorVivienda: precio,
    intAnio: 0,
    capAnio: 0
  }];

  let intAcc = 0;
  let capAcc = 0;
  let crossover = null; // primer año en que arriendo > cuota
  let aporteActualUsd = aporteMensualUsd;
  let tasaActual = tasaCopUsdInicial; // tasa_0
  let aporteAnualUsd = 0; // aporte mensual al ETF acumulado dentro del año (se resetea cada 12 meses)
  let salario = salarioMensual;

  for (let m = 1; m <= meses; m++) {
    // Tasa COP/USD del mes m (devaluación compuesta mensualmente)
    tasaActual *= 1 + devalMensual;

    // Step-up del aporte fijo al inicio de cada año cumplido (m=13, 25, 37, ...)
    if (m > 1 && (m - 1) % 12 === 0) {
      aporteActualUsd *= 1 + aporteIncrementoPct / 100;
    }

    // Seguro: vida deudor (% del saldo, decrece) + incendio (% del valor inicial, fijo).
    const seguroVidaM = saldo * seguroVidaPct / 100;
    const seguroM = seguroVidaM + seguroIncendioM;
    const costoCompra = cuota + admin + seguroM;
    const costoArriendo = arriendo + adminArriendo;

    // Gasto del arrendatario (todo es sunk siempre, valores pre-IPC-bump)
    gastoArriendoAcum += costoArriendo;

    // Aporte al ETF (todo en USD). En 'diferencia' la diferencia COP se convierte a USD a la tasa del mes.
    // Trackeamos aportadoTotalUsd como basis para el impuesto sobre rendimientos al cierre.
    if (modo === 'diferencia') {
      const dif = costoCompra - costoArriendo;
      if (dif > 0) {
        const aporteUsd = dif / tasaActual;
        etfUsd += aporteUsd;
        aportadoTotalUsd += aporteUsd;
        aporteAnualUsd += aporteUsd;
      }
    } else {
      etfUsd += aporteActualUsd;
      aportadoTotalUsd += aporteActualUsd;
      aporteAnualUsd += aporteActualUsd;
    }
    etfUsd *= 1 + etfUsdMensual;

    // Amortización
    const interesM = saldo * tasaMensual;
    const capitalM = cuota - interesM;
    saldo -= capitalM;
    intAcc += interesM;
    capAcc += capitalM;

    // Gasto sunk del comprador (intereses al banco + admin + seguro, todos sunk).
    // admin sigue pre-IPC-bump acá. Capital NO se cuenta — va al equity.
    gastoCompraSunkAcum += interesM + admin + seguroM;

    // Inflación de arriendo y gastos + crecimiento del salario
    arriendo *= 1 + ipcMensual;
    admin *= 1 + ipcMensual;
    adminArriendo *= 1 + ipcMensual;
    salario *= 1 + salMensual;

    if (crossover === null && costoArriendo > costoCompra) {
      crossover = Math.ceil(m / 12);
    }

    // Snapshot anual (etf en COP equivalente a la tasa del mes m)
    if (m % 12 === 0) {
      // AFC refund (solo escenario arriendo, year-end). Suma al ETF y al basis.
      if (aporteAfcMensual > 0) {
        const refundCop = aporteAfcMensual * 12 * tarifaRentaMarginal / 100;
        const refundUsd = refundCop / tasaActual;
        etfUsd += refundUsd;
        aportadoTotalUsd += refundUsd;
        refundAfcTotalCop += refundCop;
      }

      const a = m / 12;
      const valorVivienda = precio * Math.pow(1 + apreciacionPct / 100, a);
      const equity = valorVivienda - Math.max(saldo, 0);
      yearly.push({
        anio: a,
        equity,
        etf: etfUsd * tasaActual,
        etfValorUsd: etfUsd,           // valor del portafolio en USD (con interés compuesto)
        aportadoAcumUsd: aportadoTotalUsd, // plata aportada acumulada en USD (sin crecimiento)
        cuota,
        arriendoEq: arriendo,
        costoCompraMes: cuota + admin + seguroM,
        costoArriendoMes: arriendo + adminArriendo,
        gastoCompraSunkAcum,
        gastoArriendoAcum,
        aporteAnualUsd,
        cargaCompraPct: ((cuota + admin + seguroM) / salario) * 100,
        cargaArriendoPct: ((arriendo + adminArriendo) / salario) * 100,
        saldo: Math.max(saldo, 0),
        valorVivienda,
        intAnio: intAcc,
        capAnio: capAcc
      });
      intAcc = 0;
      capAcc = 0;
      aporteAnualUsd = 0; // reset para el siguiente año
    }
  }

  const final = yearly[yearly.length - 1];
  const totalInt = totalInterest(cuota, plazoAnios, monto);

  // Tax model — aplica al cierre del plazo (liquidación hipotética)
  const utilidadEtfUsd = Math.max(0, etfUsd - aportadoTotalUsd);
  const impuestoEtfUsd = utilidadEtfUsd * tarifaRentaMarginal / 100;
  const etfFinalUsdNeto = etfUsd - impuestoEtfUsd;

  const utilidadVivienda = final.valorVivienda - precio;
  const exencionVivienda = viviendaPrimera
    ? 7500 * UVT_BASE_COP * Math.pow(1 + ipcPct / 100, plazoAnios)
    : 0;
  const utilidadGravable = Math.max(0, utilidadVivienda - exencionVivienda);
  const impuestoGananciaVivienda = utilidadGravable * tarifaGananciaViviendaPct / 100;
  const costosVenta = final.valorVivienda * costoVentaViviendaPct / 100;
  const equityNeto = Math.max(0, final.valorVivienda - final.saldo - impuestoGananciaVivienda - costosVenta);

  // Diferencia: post-tax si toggle ON, bruta si OFF (regression invariant)
  const diferencia = aplicarImpuestos
    ? equityNeto - etfFinalUsdNeto * tasaActual
    : final.equity - final.etf;

  // Patrimonio final de cada escenario (neto si toggle ON, bruto si OFF).
  // Invariante: diferencia === patrimonioCompraFinal - patrimonioArriendoFinal.
  const patrimonioCompraFinal = aplicarImpuestos ? equityNeto : final.equity;
  const patrimonioArriendoFinal = aplicarImpuestos ? etfFinalUsdNeto * tasaActual : final.etf;

  // Seguro del primer mes: vida (sobre saldo inicial = monto) + incendio (sobre valor inicial).
  const seguroMensualInicial = monto * seguroVidaPct / 100 + seguroIncendioM;

  // Patrimonio crossover: primer año donde el signo de (equity - etf) flippea.
  // Distinto al crossover de costo mensual (arriendo > cuota) — este es de stocks acumulados.
  let crossoverPatrimonio = null;
  for (let i = 1; i < yearly.length; i++) {
    const prevSign = Math.sign(yearly[i - 1].equity - yearly[i - 1].etf);
    const currSign = Math.sign(yearly[i].equity - yearly[i].etf);
    if (prevSign !== currSign && prevSign !== 0 && currSign !== 0) {
      crossoverPatrimonio = yearly[i].anio;
      break;
    }
  }

  // Spending crossover: primer año donde el gasto SUNK de arriendo supera al sunk de comprar.
  // "Plata perdida" — comparación apples-to-apples (ambos lados sunk). Suele ser distinto
  // a los otros dos crossovers (cost monthly y patrimonio).
  let spendingCrossoverYear = null;
  for (let i = 1; i < yearly.length; i++) {
    const prevSign = Math.sign(yearly[i - 1].gastoCompraSunkAcum - yearly[i - 1].gastoArriendoAcum);
    const currSign = Math.sign(yearly[i].gastoCompraSunkAcum - yearly[i].gastoArriendoAcum);
    if (prevSign !== currSign && prevSign !== 0 && currSign !== 0) {
      spendingCrossoverYear = yearly[i].anio;
      break;
    }
  }

  return {
    input,
    cashInicial,
    monto,
    cuota,
    totalIntereses: totalInt,
    yearly,
    final,
    etfFinalUsd: etfUsd,
    etfFinalUsdNeto,
    equityNeto,
    impuestos: {
      rentaEtf: impuestoEtfUsd,
      gananciaVivienda: impuestoGananciaVivienda,
      costosVenta,
      refundAfcTotalCop
    },
    crossover,
    crossoverPatrimonio,
    spendingCrossoverYear,
    diferencia,
    patrimonioCompraFinal,
    patrimonioArriendoFinal,
    seguroMensualInicial,
    gana: diferencia >= 0 ? 'compra' : 'arriendo'
  };
}

// Palancas monótonas para goal-seek + sus rangos (límites del dominio financiero).
// `modes` indica en qué modos la palanca afecta el patrimonio FINAL (la diferencia):
//   - retornoEtf y apreciación afectan en ambos modos.
//   - tasa y arriendo solo afectan en 'diferencia' (en aporte-fijo cambian el flujo
//     de caja intermedio pero no el patrimonio a fin de plazo).
const BREAKEVEN_VARS = [
  { key: 'retornoEtfUsdPct', min: 0, max: 18, modes: ['diferencia', 'aporte-fijo'] },
  { key: 'apreciacionPct', min: 0, max: 10, modes: ['diferencia', 'aporte-fijo'] },
  { key: 'tasaEA', min: 4, max: 18, modes: ['diferencia'] },
  { key: 'arriendoInicial', min: 0.5e6, max: 6e6, modes: ['diferencia'] }
];

/**
 * Goal-seek: encuentra el valor de input[key] en [min, max] donde diferencia
 * cruza 0 (punto de quiebre / empate), por bisección. Devuelve null si no hay
 * cruce dentro del rango (la diferencia tiene el mismo signo en ambos extremos).
 *
 * Asume monotonía de diferencia respecto a key — válido para las palancas en
 * BREAKEVEN_VARS. NO se llama dentro de simulate() (evita recursión).
 *
 * @param {Object} input  Input base para simulate()
 * @param {string} key    Nombre de la variable a resolver
 * @param {number} min    Límite inferior del rango de búsqueda
 * @param {number} max    Límite superior del rango de búsqueda
 * @returns {number|null} Valor de quiebre, o null si no cruza en el rango
 */
function goalSeek(input, key, min, max) {
  const difAt = (v) => simulate({ ...input, [key]: v }).diferencia;
  let lo = min, hi = max;
  const dLo = difAt(lo);
  const dHi = difAt(hi);
  if (dLo === 0) return lo;
  if (dHi === 0) return hi;
  if (Math.sign(dLo) === Math.sign(dHi)) return null; // sin cruce en el rango

  for (let i = 0; i < 50 && (hi - lo) > 1e-6; i++) {
    const mid = (lo + hi) / 2;
    const dMid = difAt(mid);
    if (dMid === 0) return mid;
    if (Math.sign(dMid) === Math.sign(dLo)) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Corre goalSeek para las 4 palancas y devuelve sus puntos de quiebre.
 *
 * @param {Object} input  Input base para simulate()
 * @returns {Array<{key:string, umbral:(number|null), actual:number}>}
 */
function breakevens(input) {
  const modo = input.modo || 'diferencia';
  return BREAKEVEN_VARS
    .filter((v) => v.modes.includes(modo))
    .map(({ key, min, max }) => ({
      key,
      umbral: goalSeek(input, key, min, max),
      actual: input[key]
    }));
}

/**
 * Tabla de amortización mes a mes (plan de pagos del banco).
 * Solo la parte hipoteca + seguros — no incluye el ETF.
 *
 * @param {Object} input  Mismos inputs que simulate() (usa precio, cuotaInicialPct,
 *                         tasaEA, plazoAnios, seguroVidaPct, seguroIncendioPct)
 * @returns {Array<{mes,cuota,interes,capital,seguroVida,seguroIncendio,cuotaTotal,saldo}>}
 */
function amortizationSchedule(input) {
  const {
    precio,
    cuotaInicialPct,
    tasaEA,
    plazoAnios,
    seguroVidaPct = 0.05,
    seguroIncendioPct = 0.045
  } = input;

  const monto = precio - (precio * cuotaInicialPct) / 100;
  const meses = plazoAnios * 12;
  const tasaMensual = eaToMonthly(tasaEA);
  const cuota = monthlyPayment(monto, tasaEA, plazoAnios);
  const seguroIncendioM = precio * seguroIncendioPct / 100; // fijo sobre el valor inicial

  const rows = [];
  let saldo = monto;
  for (let m = 1; m <= meses; m++) {
    const interes = saldo * tasaMensual;
    const capital = cuota - interes;
    const seguroVida = saldo * seguroVidaPct / 100; // sobre el saldo al inicio del mes
    const cuotaTotal = cuota + seguroVida + seguroIncendioM;
    saldo -= capital;
    rows.push({
      mes: m,
      cuota,
      interes,
      capital,
      seguroVida,
      seguroIncendio: seguroIncendioM,
      cuotaTotal,
      saldo: Math.max(saldo, 0)
    });
  }
  return rows;
}

/**
 * Suma cada columna del plan de pagos (totales a lo largo de todo el plazo).
 *
 * @param {Array} schedule Salida de amortizationSchedule()
 * @returns {{interes,capital,cuota,seguroVida,seguroIncendio,cuotaTotal}}
 */
function scheduleTotals(schedule) {
  return schedule.reduce((acc, r) => ({
    interes: acc.interes + r.interes,
    capital: acc.capital + r.capital,
    cuota: acc.cuota + r.cuota,
    seguroVida: acc.seguroVida + r.seguroVida,
    seguroIncendio: acc.seguroIncendio + r.seguroIncendio,
    cuotaTotal: acc.cuotaTotal + r.cuotaTotal
  }), { interes: 0, capital: 0, cuota: 0, seguroVida: 0, seguroIncendio: 0, cuotaTotal: 0 });
}

/**
 * Genera un texto de recomendación humano según el resultado.
 * Centraliza la lógica de "lectura" para que sea fácil ajustar el tono.
 *
 * @param {Object} result Resultado de simulate()
 * @returns {string}
 */
function generarRecomendacion(result) {
  const dif = result.diferencia / 1e6; // en millones
  const abs = Math.abs(dif).toFixed(0);

  if (dif > 100) {
    return `Comprar gana claramente con estos supuestos: terminas con $${abs}M más que arrendando + invirtiendo. La cuota fija contra arriendo creciente paga el costo de los intereses con creces.`;
  }
  if (dif > 0) {
    return `Comprar gana por poco ($${abs}M). El margen es estrecho — pequeños cambios en apreciación o retorno del ETF pueden invertir el resultado. Revisa si vale la pena el menor flujo de caja durante la hipoteca.`;
  }
  if (dif > -100) {
    return `Arrendar gana por poco ($${abs}M). El ETF compone más rápido que la apreciación + ahorro de arriendo. Solo si tienes la disciplina de invertir religiosamente la diferencia.`;
  }
  return `Arrendar gana claramente ($${abs}M más). Con esta tasa o este retorno del ETF, el costo financiero de la hipoteca supera los beneficios de poseer.`;
}

// Presets de ESCENARIO — cada uno setea varias variables coherentes.
// Formato: { label, modo?, sliders: { sliderId: value } }.
// Las keys de `sliders` son IDs de sliders del DOM; `modo` (opcional) cambia el tab.
const PRESETS = {
  'joven-fna':     { label: 'Joven FNA',                 sliders: { tasa: 8.8, ci: 10, plazo: 30 } },
  'banca':         { label: 'Banca tradicional',          sliders: { tasa: 12.5, ci: 30, plazo: 20 } },
  'inversionista': { label: 'Inversionista disciplinado', modo: 'aporte-fijo', sliders: { aporte: 400, incr: 10, etf: 9 } },
  'conservador':   { label: 'Conservador',                sliders: { apr: 3, etf: 6, dev: 2 } }
};

export {
  simulate,
  monthlyPayment,
  totalInterest,
  eaToMonthly,
  generarRecomendacion,
  goalSeek,
  breakevens,
  amortizationSchedule,
  scheduleTotals,
  PRESETS
};
