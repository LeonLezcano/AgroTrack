/**
 * AgroTrack - Tank Mix Calculator & Loading Order Engine
 * Fitosanitary Spray Mix Sequence & Product Reconciliation
 */

export class TankMixCalculator {
  /**
   * Orden agronómico estricto de mezclado en tanque para evitar corte de caldo
   */
  static getAgronomicLoadingSequence() {
    return [
      { step: 1, category: 'Acondicionador de Agua / Corrector de pH', code: 'WATER_COND', description: 'Cargar el 50% del agua limpia en el tanque, activar agitador y agregar el corrector.' },
      { step: 2, category: 'Bolsas Hidrosolubles & Polvos Mojables (WP / WDG)', code: 'SOLID_WP', description: 'Disolver en balde previo o incorporar con hidrocargador hasta disolución completa.' },
      { step: 3, category: 'Suspensiones Concentradas (SC / Flowable)', code: 'LIQUID_SC', description: 'Agitar bien el bidón antes de verter. Mantener retorno continuo del agitador.' },
      { step: 4, category: 'Concentrados Emulsionables (EC / SL)', code: 'EMUL_EC', description: 'Forman emulsión lechosa. Incorporar lentamente con tanque al 80% de agua.' },
      { step: 5, category: 'Coadyuvantes, Aceites Metilados & Fertilizantes Foliares', code: 'ADJUVANT', description: 'Completar con agua hasta el nivel final y agregar el tensioactivo/aceite al final.' }
    ];
  }

  /**
   * Calcula el volumen total de caldo, número de cargas de tanque y cantidad de insumos
   * @param {number} hectares - Superficie neta a aplicar
   * @param {number} waterRateLPerHa - Caudal de aplicación (l/ha) (ej. 50-70 l/ha terrestre o 10-15 l/ha dron)
   * @param {number} tankCapacityLiters - Capacidad del tanque de la máquina (ej. 3000 lts)
   * @param {Array} products - Lista de insumos prescriptos con su dosis por hectárea
   */
  static calculateMixPlan({
    hectares,
    waterRateLPerHa = 60,
    tankCapacityLiters = 3000,
    products = []
  }) {
    const ha = Number(hectares);
    const rate = Number(waterRateLPerHa);
    const tankCap = Number(tankCapacityLiters);

    if (ha <= 0 || rate <= 0 || tankCap <= 0) {
      throw new Error('Hectáreas, caudal de agua y capacidad de tanque deben ser mayores a 0');
    }

    const totalCaldoLiters = Math.round(ha * rate * 10) / 10;
    const fullTanks = Math.floor(totalCaldoLiters / tankCap);
    const remainingLiters = Math.round((totalCaldoLiters % tankCap) * 10) / 10;
    const totalTankLoads = remainingLiters > 0 ? fullTanks + 1 : fullTanks;

    // Calculate product quantities
    const productReconciliation = products.map((prod, idx) => {
      const dosePerHa = Number(prod.dosePerHa) || 0;
      const totalProductNeeded = Math.round(ha * dosePerHa * 100) / 100;
      const unit = prod.unit || 'litros'; // 'litros', 'kg', 'cm3'

      return {
        id: prod.id || `PROD-${idx + 1}`,
        name: String(prod.name).trim(),
        category: prod.category || 'Herbicida',
        dosePerHa,
        unit,
        totalProductNeeded,
        containersRequired: prod.containerSizeLiters
          ? Math.ceil(totalProductNeeded / prod.containerSizeLiters)
          : null,
        loadingStep: prod.loadingStep || 3
      };
    });

    return {
      hectares: ha,
      waterRateLPerHa: rate,
      totalCaldoLiters,
      tankCapacityLiters: tankCap,
      fullTanks,
      remainingLiters,
      totalTankLoads,
      loadingSequence: this.getAgronomicLoadingSequence(),
      products: productReconciliation,
      calculatedAt: new Date().toISOString()
    };
  }
}
