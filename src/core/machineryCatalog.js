/**
 * AgroTrack - Machinery Catalog & Fuel Consumption Engine
 * Fleet Management (Sprayers, Drones, Harvesters, Tractors)
 */

export class MachineryCatalog {
  constructor() {
    this.machinery = new Map();
    this.idCounter = 100;
  }

  generateId() {
    this.idCounter += 1;
    return `MAQ-${this.idCounter}-${Date.now().toString(36).slice(-4)}`;
  }

  registerMachine(data) {
    if (!data.name || !data.type || !data.brand) {
      throw new Error('Nombre, Tipo y Marca de Maquinaria son obligatorios');
    }

    const machineId = data.id || this.generateId();
    const machine = {
      id: machineId,
      name: String(data.name).trim(),
      type: String(data.type).trim(), // 'Pulverizadora Autopropulsada Terrestre', 'Dron Agrícola de Gran Porte', 'Cosechadora de Granos', 'Sembradora Directa'
      brand: String(data.brand).trim(),
      model: data.model || 'Standard',
      year: Number(data.year) || new Date().getFullYear(),
      tankCapacityLiters: Number(data.tankCapacityLiters) || 3000,
      boomWidthMeters: Number(data.boomWidthMeters) || 32, // Ancho de labor en metros
      fuelConsumptionLitersPerHa: Number(data.fuelConsumptionLitersPerHa) || 1.8, // Consumo gasoil l/ha
      engineHours: Number(data.engineHours) || 0,
      assignedOperator: data.assignedOperator || 'Maquinista de Cuadrilla',
      status: data.status || 'available', // 'available', 'working_in_field', 'maintenance'
      createdAt: data.createdAt || new Date().toISOString()
    };

    this.machinery.set(machineId, machine);
    return machine;
  }

  updateMachine(id, updates) {
    const machine = this.machinery.get(id);
    if (!machine) throw new Error(`Maquinaria no encontrada: ${id}`);

    const safe = { ...updates };
    delete safe.id;
    delete safe.createdAt;

    Object.assign(machine, safe);
    this.machinery.set(id, machine);
    return machine;
  }

  getMachine(id) {
    return this.machinery.get(id) || null;
  }

  listMachinery(filter = {}) {
    let result = Array.from(this.machinery.values());

    if (filter.status) {
      result = result.filter(m => m.status === filter.status);
    }
    if (filter.type) {
      result = result.filter(m => m.type.toLowerCase().includes(filter.type.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q)
      );
    }

    return result;
  }

  calculateFuelEstimate(machineId, hectares) {
    const machine = this.machinery.get(machineId);
    if (!machine) throw new Error(`Maquinaria no encontrada: ${machineId}`);

    const ha = Number(hectares) || 0;
    const estimatedLiters = Math.round(ha * machine.fuelConsumptionLitersPerHa * 10) / 10;

    return {
      machineId,
      machineName: machine.name,
      hectares: ha,
      consumptionRateLPerHa: machine.fuelConsumptionLitersPerHa,
      estimatedFuelLiters: estimatedLiters
    };
  }
}
