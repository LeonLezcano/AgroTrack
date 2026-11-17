/**
 * AgroTrack Formatters - Formato Agronómico, Meteorológico y Financiero para Argentina
 */

export function formatARS(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatUSD(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatHectares(ha) {
  const num = Number(ha) || 0;
  return `${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
}

export function formatLitersPerHa(lha) {
  const num = Number(lha) || 0;
  return `${num.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l/ha`;
}

export function formatDate(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Evaluación de Semáforo Meteorológico y Delta T para Pulverización
 * @param {number} deltaT - Valor de Delta T en °C
 * @param {number} windSpeedKmH - Velocidad de viento en km/h
 */
export function evaluateDeltaTSafety(deltaT, windSpeedKmH) {
  const dt = Number(deltaT);
  const wind = Number(windSpeedKmH);

  if (isNaN(dt) || isNaN(wind)) {
    return {
      status: 'danger',
      label: 'DATOS INVÁLIDOS',
      message: 'Medición meteorológica incompleta',
      className: 'bg-[#4c0519] text-[#fecdd3] border-[#be123c]'
    };
  }

  // Alerta de viento extremo
  if (wind > 18) {
    return {
      status: 'danger',
      label: 'VIENTO EXTREMO (RIESGO DE DERIVA)',
      message: `Viento de ${wind} km/h supera el límite recomendado de 15-18 km/h. Suspender aplicación.`,
      className: 'bg-[#4c0519] text-[#fecdd3] border-[#be123c] font-bold'
    };
  }

  if (wind < 3) {
    // Riesgo de inversión térmica
    return {
      status: 'warning',
      label: 'CALMA TOTAL (INVERSIÓN TÉRMICA)',
      message: `Viento < 3 km/h. Alto riesgo de inversión térmica y nube flotante.`,
      className: 'bg-[#451a03] text-[#fde68a] border-[#b45309] font-bold'
    };
  }

  // Evaluación de Delta T
  if (dt < 2) {
    return {
      status: 'warning',
      label: 'DELTA T BAJO (< 2°C)',
      message: `Evaporación casi nula. Riesgo de escurrimiento o rocío excesivo.`,
      className: 'bg-[#0c292b] text-[#a5f3fc] border-[#155e63] font-semibold'
    };
  } else if (dt >= 2 && dt <= 8) {
    return {
      status: 'safe',
      label: 'VENTANA ÓPTIMA (DELTA T 2-8°C)',
      message: `Condiciones excelentes. Gotas estables y máxima eficacia biológica.`,
      className: 'bg-[#052e16] text-[#bbf7d0] border-[#166534] font-bold'
    };
  } else if (dt > 8 && dt <= 10) {
    return {
      status: 'warning',
      label: 'MARGEN CRÍTICO (DELTA T 8-10°C)',
      message: `Alta evaporación. Obligatorio boquilla antideriva y aumento de tamaño de gota.`,
      className: 'bg-[#451a03] text-[#fde68a] border-[#b45309] font-semibold'
    };
  } else {
    // dt > 10
    return {
      status: 'danger',
      label: 'ALERTA ROJA (DELTA T > 10°C)',
      message: `Evaporación severa de gotas en el aire. Prohibido pulverizar.`,
      className: 'bg-[#4c0519] text-[#fecdd3] border-[#be123c] font-bold'
    };
  }
}
