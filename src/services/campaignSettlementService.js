/**
 * AgroTrack - Campaign Settlement & Fuel Balance Engine
 * Engine #134 (Campaign Settlement) & Universal CSV Exporter with UTF-8 BOM (Directiva 17)
 */

import { sha256 } from '../utils/cryptoSeal.js';
import { formatARS, formatUSD, formatHectares } from '../utils/formatters.js';

export class CampaignSettlementService {
  constructor(laborService, fieldRegistry) {
    this.laborService = laborService;
    this.fieldRegistry = fieldRegistry;
    this.settlements = new Map();
    this.idCounter = 100;
  }

  generateSettlementId() {
    this.idCounter += 1;
    return `SET-${this.idCounter}-${Date.now().toString(36).slice(-4)}`;
  }

  generateCampaignSettlement({ producerName, campaignTitle = 'Campaña Gruesa 2026/2027' }) {
    if (!producerName) throw new Error('Nombre del Productor es obligatorio');

    const cleanProd = producerName.trim();
    const allOrders = this.laborService.listLaborOrders({ status: 'completed' });
    const eligibleOrders = allOrders.filter(o =>
      o.producerName.toLowerCase() === cleanProd.toLowerCase()
    );

    if (eligibleOrders.length === 0) {
      throw new Error(`No hay labores completadas para el productor ${cleanProd}`);
    }

    // Verify cryptographic integrity of all orders
    const auditAnomalies = [];
    eligibleOrders.forEach(o => {
      const check = this.laborService.verifyLaborIntegrity(o.id);
      if (check.isTampered) {
        auditAnomalies.push(`Orden ${o.id} presenta inconsistencias de firma o hectáreas adulteradas`);
      }
    });

    const totalHectares = eligibleOrders.reduce((sum, o) => sum + (o.hectaresApplied || 0), 0);
    const totalAmountUSD = eligibleOrders.reduce((sum, o) => sum + (o.totalAmountUSD || 0), 0);
    const totalAmountARS = eligibleOrders.reduce((sum, o) => sum + (o.totalAmountARS || 0), 0);
    const totalFuelUsedLiters = eligibleOrders.reduce((sum, o) => sum + (o.fuelUsedLiters || 0), 0);

    const settlementId = this.generateSettlementId();
    const generatedAt = new Date().toISOString();

    const settlement = {
      id: settlementId,
      producerName: cleanProd,
      campaignTitle,
      generatedAt,
      totalOrders: eligibleOrders.length,
      totalHectares: Math.round(totalHectares * 100) / 100,
      totalAmountUSD: Math.round(totalAmountUSD * 100) / 100,
      totalAmountARS: Math.round(totalAmountARS),
      totalFuelUsedLiters: Math.round(totalFuelUsedLiters * 10) / 10,
      auditStatus: auditAnomalies.length === 0 ? 'audited_zero_disputes' : 'requires_review',
      auditAnomalies,
      ordersList: eligibleOrders.map(o => ({
        orderId: o.id,
        lotName: o.lotName,
        establishmentName: o.establishmentName,
        laborType: o.laborType,
        crop: o.crop,
        machineName: o.machineName,
        hectaresApplied: o.hectaresApplied,
        ratePerHaUSD: o.ratePerHaUSD,
        totalUSD: o.totalAmountUSD,
        totalARS: o.totalAmountARS,
        fuelUsedLiters: o.fuelUsedLiters,
        completedAt: o.completedAt,
        hashSeal: o.hashSeal
      })),
      settlementHash: null
    };

    // Settlement cryptographic seal
    const payload = JSON.stringify({
      settlementId,
      producerName: settlement.producerName,
      campaignTitle: settlement.campaignTitle,
      totalHectares: settlement.totalHectares,
      totalAmountUSD: settlement.totalAmountUSD,
      generatedAt
    });
    settlement.settlementHash = sha256(payload);

    this.settlements.set(settlementId, settlement);
    return settlement;
  }

  getSettlement(id) {
    return this.settlements.get(id) || null;
  }

  listSettlements() {
    return Array.from(this.settlements.values());
  }

  /**
   * Exportación Universal en CSV con BOM UTF-8 (\uFEFF) para Excel en Windows (Directiva 17)
   */
  exportSettlementCSV(settlementId) {
    const set = this.settlements.get(settlementId);
    if (!set) throw new Error(`Liquidación no encontrada: ${settlementId}`);

    const lines = [];
    lines.push(`LIQUIDACIÓN DE LABORES AGRÍCOLAS - AGROTRACK`);
    lines.push(`Liquidación ID;${set.id}`);
    lines.push(`Productor / Cliente;${set.producerName}`);
    lines.push(`Campaña;${set.campaignTitle}`);
    lines.push(`Total Hectáreas Certificadas;${formatHectares(set.totalHectares)}`);
    lines.push(`Importe Total USD;${formatUSD(set.totalAmountUSD)}`);
    lines.push(`Importe Total ARS;${formatARS(set.totalAmountARS)}`);
    lines.push(`Gasoil Total Consumido (lts);${set.totalFuelUsedLiters}`);
    lines.push(`Estado Auditoría;${set.auditStatus}`);
    lines.push(`Sello Hash Criptográfico;${set.settlementHash}`);
    lines.push(``);
    lines.push(`DETALLE DE ÓRDENES CERTIFICADAS CON DOBLE FIRMA ePOD`);
    lines.push(`ID Orden;Lote;Campo;Labor;Cultivo;Máquina;Ha Certificadas;Tarifa USD/ha;Subtotal USD;Subtotal ARS;Gasoil (L);Fecha;Sello SHA-256`);

    set.ordersList.forEach(o => {
      lines.push(
        `"${o.orderId}";"${o.lotName}";"${o.establishmentName}";"${o.laborType}";"${o.crop}";"${o.machineName}";"${o.hectaresApplied}";"${o.ratePerHaUSD}";"${o.totalUSD}";"${o.totalARS}";"${o.fuelUsedLiters}";"${o.completedAt}";"${o.hashSeal}"`
      );
    });

    return '\uFEFF' + lines.join('\r\n');
  }
}
