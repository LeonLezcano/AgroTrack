/**
 * AgroTrack - Delta T & Agricultural Psychrometric Sentinel
 * Engine #125 (Psychrometric Delta T & Drift Defense)
 * Stull's Wet-Bulb Equation & Spray Drift Window Evaluator
 */

import { evaluateDeltaTSafety } from '../utils/formatters.js';

export class DeltaTSentinel {
  /**
   * Calcula la temperatura de bulbo húmedo (Tw) en °C usando la fórmula psicrométrica de Stull
   * @param {number} dryBulbC - Temperatura de bulbo seco en °C
   * @param {number} relativeHumidityPct - Humedad relativa (0 - 100)
   * @returns {number} Wet-bulb temperature en °C
   */
  static calculateWetBulbTemperature(dryBulbC, relativeHumidityPct) {
    const T = Number(dryBulbC);
    const RH = Math.max(1, Math.min(100, Number(relativeHumidityPct)));

    if (isNaN(T)) return NaN;

    // Stull's empirical psychrometric approximation for wet-bulb temperature
    const tw =
      T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
      Math.atan(T + RH) -
      Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035;

    return Math.round(tw * 10) / 10;
  }

  /**
   * Calcula Delta T = T (bulbo seco) - Tw (bulbo húmedo)
   */
  static calculateDeltaT(dryBulbC, relativeHumidityPct) {
    const T = Number(dryBulbC);
    const Tw = this.calculateWetBulbTemperature(T, relativeHumidityPct);

    if (isNaN(Tw)) return NaN;
    const deltaT = T - Tw;
    return Math.max(0, Math.round(deltaT * 10) / 10);
  }

  /**
   * Evalúa la condición meteorológica completa para pulverización
   */
  static evaluateSprayConditions({
    temperatureC,
    relativeHumidityPct,
    windSpeedKmH,
    windDirectionDeg = 0,
    windDirectionName = 'S'
  }) {
    const temp = Number(temperatureC);
    const rh = Number(relativeHumidityPct);
    const wind = Number(windSpeedKmH);

    const deltaT = this.calculateDeltaT(temp, rh);
    const evaluation = evaluateDeltaTSafety(deltaT, wind);

    const isSprayPermitted = evaluation.status !== 'danger';

    return {
      temperatureC: temp,
      relativeHumidityPct: rh,
      windSpeedKmH: wind,
      windDirectionDeg,
      windDirectionName,
      deltaT,
      status: evaluation.status, // 'safe', 'warning', 'danger'
      label: evaluation.label,
      message: evaluation.message,
      badgeClass: evaluation.className,
      isSprayPermitted,
      evaluatedAt: new Date().toISOString()
    };
  }
}
