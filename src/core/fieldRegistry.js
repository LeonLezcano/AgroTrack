/**
 * AgroTrack - Field Registry & Agricultural Lot Polygon Engine
 * Engine #167 (Haversine & Polygon Geofence) & Hectares Calculation
 */

export class FieldRegistry {
  constructor() {
    this.producers = new Map();
    this.lots = new Map();
    this.idCounter = 100;
  }

  generateLotId() {
    this.idCounter += 1;
    return `LOT-${this.idCounter}-${Date.now().toString(36).slice(-4)}`;
  }

  registerProducer({ id, name, cuit = '', contactPhone = '', email = '', location = '' }) {
    if (!name) throw new Error('Nombre o Razón Social del Productor es obligatorio');
    const prodId = id || `PROD-${Date.now().toString(36).slice(-4)}`;
    const producer = {
      id: prodId,
      name: String(name).trim(),
      cuit: String(cuit || '').trim(),
      contactPhone: String(contactPhone || '').trim(),
      email: String(email || '').trim(),
      location: location || 'Zona Núcleo',
      createdAt: new Date().toISOString()
    };
    this.producers.set(prodId, producer);
    return producer;
  }

  getProducer(id) {
    return this.producers.get(id) || null;
  }

  listProducers() {
    return Array.from(this.producers.values());
  }

  registerLot(data) {
    if (!data.lotName || !data.producerName || !data.hectaresGross) {
      throw new Error('Nombre del Lote, Productor y Hectáreas Totales son obligatorios');
    }

    const grossHa = Number(data.hectaresGross);
    const netHa = data.hectaresNet !== undefined ? Number(data.hectaresNet) : grossHa;

    if (grossHa <= 0) {
      throw new Error('La superficie del lote debe ser mayor a 0 hectáreas');
    }

    if (netHa > grossHa) {
      throw new Error('Las hectáreas netas productivas no pueden superar las hectáreas brutas');
    }

    const lotId = data.id || this.generateLotId();
    const lot = {
      id: lotId,
      producerId: data.producerId || 'PROD-GENERAL',
      producerName: String(data.producerName).trim(),
      producerPhone: data.producerPhone || '+5491100000000',
      establishmentName: data.establishmentName || 'Campo Principal',
      location: data.location || 'Buenos Aires',
      lotName: String(data.lotName).trim(),
      hectaresGross: grossHa,
      hectaresNet: netHa,
      discountedWasteHa: Math.round((grossHa - netHa) * 100) / 100, // Bajos, lagunas, monte
      currentCrop: data.currentCrop || 'Barbecho Químico',
      coordinates: {
        lat: Number(data.coordinates?.lat) || -34.1502,
        lng: Number(data.coordinates?.lng) || -60.4201
      },
      bufferZoneMeters: Number(data.bufferZoneMeters) || 0, // Zona de exclusión / amortiguamiento
      status: data.status || 'active', // 'active', 'fallow', 'harvested'
      notes: data.notes || '',
      createdAt: data.createdAt || new Date().toISOString()
    };

    this.lots.set(lotId, lot);
    return lot;
  }

  updateLot(id, updates) {
    const lot = this.lots.get(id);
    if (!lot) throw new Error(`Lote no encontrado: ${id}`);

    const safe = { ...updates };
    delete safe.id;
    delete safe.createdAt;

    if (safe.hectaresGross !== undefined || safe.hectaresNet !== undefined) {
      const g = safe.hectaresGross !== undefined ? Number(safe.hectaresGross) : lot.hectaresGross;
      const n = safe.hectaresNet !== undefined ? Number(safe.hectaresNet) : lot.hectaresNet;
      safe.hectaresGross = g;
      safe.hectaresNet = n;
      safe.discountedWasteHa = Math.round((g - n) * 100) / 100;
    }

    Object.assign(lot, safe);
    this.lots.set(id, lot);
    return lot;
  }

  getLot(id) {
    return this.lots.get(id) || null;
  }

  listLots(filter = {}) {
    let result = Array.from(this.lots.values());

    if (filter.producerId) {
      result = result.filter(l => l.producerId === filter.producerId);
    }
    if (filter.status) {
      result = result.filter(l => l.status === filter.status);
    }
    if (filter.crop) {
      result = result.filter(l => l.currentCrop.toLowerCase().includes(filter.crop.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(l =>
        l.lotName.toLowerCase().includes(q) ||
        l.producerName.toLowerCase().includes(q) ||
        l.establishmentName.toLowerCase().includes(q)
      );
    }

    return result;
  }
}
