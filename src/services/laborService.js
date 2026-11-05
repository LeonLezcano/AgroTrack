/**
 * AgroTrack - Agricultural Labor Certification & ePOD Engine
 * Engine #245 (ePOD Field Signature) & Engine #159 (Crypto Hash Audit Ledger)
 * Eliminates hectare disputes between Contractor and Agricultural Producer.
 */

import { sha256 } from '../utils/cryptoSeal.js';
import { DeltaTSentinel } from '../core/deltaTSentinel.js';

export class LaborService {
  constructor(fieldRegistry, machineryCatalog) {
    this.fieldRegistry = fieldRegistry;
    this.machineryCatalog = machineryCatalog;
    this.orders = new Map();
    this.idCounter = 100;
  }

  generateOrderId() {
    this.idCounter += 1;
    return `ORD-${this.idCounter}-${Date.now().toString(36).slice(-4)}`;
  }

  createLaborOrder({
    lotId,
    machineId,
    laborType = 'Pulverización Terrestre',
    ratePerHaUSD = 11.0,
    ratePerHaARS = 14500,
    operatorName = 'Maquinista de Cuadrilla',
    recipeAgronomicNumber = 'REC-AGRO-001',
    fuelProvidedBy = 'contractor' // 'contractor' | 'producer'
  }) {
    const lot = this.fieldRegistry.getLot(lotId);
    if (!lot) throw new Error(`Lote agrícola no encontrado: ${lotId}`);

    const machine = this.machineryCatalog.getMachine(machineId);
    if (!machine) throw new Error(`Maquinaria no encontrada: ${machineId}`);

    const orderId = this.generateOrderId();
    const order = {
      id: orderId,
      lotId,
      lotName: lot.lotName,
      establishmentName: lot.establishmentName,
      producerName: lot.producerName,
      producerPhone: lot.producerPhone,
      crop: lot.currentCrop,
      targetHectares: lot.hectaresNet,
      hectaresGross: lot.hectaresGross,
      machineId,
      machineName: machine.name,
      laborType,
      ratePerHaUSD: Number(ratePerHaUSD) || 11.0,
      ratePerHaARS: Number(ratePerHaARS) || 14500,
      operatorName: String(operatorName).trim(),
      recipeAgronomicNumber: String(recipeAgronomicNumber).trim(),
      fuelProvidedBy,
      status: 'draft', // 'draft', 'in_progress', 'completed', 'aborted_weather'
      weatherReadings: [],
      hectaresApplied: 0,
      signatures: null,
      notes: '',
      hashSeal: null,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.orders.set(orderId, order);
    return order;
  }

  recordWeatherCheck(orderId, weatherData) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Orden de labor no encontrada: ${orderId}`);

    const evalResult = DeltaTSentinel.evaluateSprayConditions(weatherData);
    order.weatherReadings.push(evalResult);

    if (order.status === 'draft') {
      order.status = 'in_progress';
    }

    this.orders.set(orderId, order);
    return {
      order,
      weatherEvaluation: evalResult
    };
  }

  completeLaborOrder({
    orderId,
    hectaresApplied,
    operatorSignature,
    producerSignature,
    signerName = 'Encargado de Campo',
    signerRole = 'Ingeniero Agrónomo / Productor',
    fuelUsedLiters = 0,
    notes = ''
  }) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Orden de labor no encontrada: ${orderId}`);

    if (order.status === 'completed') {
      throw new Error(`La orden ${orderId} ya ha sido finalizada y sellada criptográficamente.`);
    }

    const appliedHa = Number(hectaresApplied);
    if (isNaN(appliedHa) || appliedHa <= 0) {
      throw new Error('Debe certificar la cantidad de hectáreas reales aplicadas');
    }

    if (!operatorSignature || operatorSignature.length < 20) {
      throw new Error('La firma del maquinista / aplicador es obligatoria');
    }

    if (!producerSignature || producerSignature.length < 20) {
      throw new Error('La firma de conformidad del productor o agrónomo es obligatoria');
    }

    const nowIso = new Date().toISOString();
    order.hectaresApplied = appliedHa;
    order.fuelUsedLiters = Number(fuelUsedLiters) || 0;
    order.completedAt = nowIso;
    order.notes = notes || '';
    order.status = 'completed';

    order.signatures = {
      operatorSignature,
      producerSignature,
      signerName: String(signerName).trim(),
      signerRole: String(signerRole).trim(),
      signedAt: nowIso
    };

    // Total Labor Amount
    order.totalAmountUSD = Math.round(appliedHa * order.ratePerHaUSD * 100) / 100;
    order.totalAmountARS = Math.round(appliedHa * order.ratePerHaARS);

    // Cryptographic Seal (Engine #159)
    const sealPayload = JSON.stringify({
      orderId: order.id,
      lotId: order.lotId,
      producerName: order.producerName,
      machineId: order.machineId,
      hectaresApplied: order.hectaresApplied,
      ratePerHaUSD: order.ratePerHaUSD,
      totalAmountUSD: order.totalAmountUSD,
      recipeAgronomicNumber: order.recipeAgronomicNumber,
      weatherChecksCount: order.weatherReadings.length,
      signatures: {
        signerName: order.signatures.signerName,
        signerRole: order.signatures.signerRole,
        signedAt: order.signatures.signedAt
      },
      completedAt: order.completedAt
    });

    order.hashSeal = sha256(sealPayload);
    this.orders.set(orderId, order);
    return order;
  }

  getOrder(id) {
    return this.orders.get(id) || null;
  }

  listLaborOrders(filter = {}) {
    let result = Array.from(this.orders.values());

    if (filter.status) {
      result = result.filter(o => o.status === filter.status);
    }
    if (filter.lotId) {
      result = result.filter(o => o.lotId === filter.lotId);
    }
    if (filter.laborType) {
      result = result.filter(o => o.laborType === filter.laborType);
    }
    if (filter.producerName) {
      result = result.filter(o => o.producerName.toLowerCase().includes(filter.producerName.toLowerCase()));
    }

    return result;
  }

  verifyLaborIntegrity(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Orden no encontrada: ${orderId}`);

    if (!order.hashSeal || order.status !== 'completed') {
      return { isTampered: false, isCompleted: false, message: 'Orden aún no completada ni sellada' };
    }

    const sealPayload = JSON.stringify({
      orderId: order.id,
      lotId: order.lotId,
      producerName: order.producerName,
      machineId: order.machineId,
      hectaresApplied: order.hectaresApplied,
      ratePerHaUSD: order.ratePerHaUSD,
      totalAmountUSD: order.totalAmountUSD,
      recipeAgronomicNumber: order.recipeAgronomicNumber,
      weatherChecksCount: order.weatherReadings.length,
      signatures: {
        signerName: order.signatures.signerName,
        signerRole: order.signatures.signerRole,
        signedAt: order.signatures.signedAt
      },
      completedAt: order.completedAt
    });

    const expectedHash = sha256(sealPayload);
    const matches = expectedHash === order.hashSeal;

    return {
      orderId,
      isTampered: !matches,
      hashMatches: matches,
      currentHash: expectedHash,
      storedSeal: order.hashSeal
    };
  }
}
