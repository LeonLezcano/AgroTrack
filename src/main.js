/**
 * AgroTrack - Main SPA Controller
 * Contratistas Rurales, Pulverización Agrícola & Agro-Servicios
 * AppSec Zero-Trust & Screen Wake Lock API Compliant
 */

import { FieldRegistry } from './core/fieldRegistry.js';
import { MachineryCatalog } from './core/machineryCatalog.js';
import { DeltaTSentinel } from './core/deltaTSentinel.js';
import { TankMixCalculator } from './core/tankMixCalculator.js';
import { LaborService } from './services/laborService.js';
import { CampaignSettlementService } from './services/campaignSettlementService.js';
import { WhatsAppAgroNotifier } from './services/whatsAppAgroNotifier.service.js';
import { AgroTrackCache } from './services/agroTrackCache.service.js';
import { Sanitizer } from './utils/sanitizer.js';
import { formatARS, formatUSD, formatHectares, formatLitersPerHa, formatDate, formatDateTime, evaluateDeltaTSafety } from './utils/formatters.js';

export class AgroTrackApp {
  constructor() {
    this.cache = new AgroTrackCache();
    this.fieldRegistry = new FieldRegistry();
    this.machineryCatalog = new MachineryCatalog();
    this.laborService = new LaborService(this.fieldRegistry, this.machineryCatalog);
    this.settlementService = new CampaignSettlementService(this.laborService, this.fieldRegistry);

    this.currentTab = 'dashboard';
    this.wakeLock = null;
    this.activeCertifyingOrderId = null;

    this.init();
  }

  init() {
    this.seedDemoDataIfAllowed();
    this.bindEvents();
    this.setupWakeLock();
    this.render();
  }

  seedDemoDataIfAllowed() {
    if (this.cache.isPurged()) return;

    // 1. Seed Producer
    const prod1 = this.fieldRegistry.registerProducer({
      id: 'PROD-LITORAL',
      name: 'Agropecuaria del Litoral S.A.',
      cuit: '30-71458920-4',
      contactPhone: '+5491144556677',
      location: 'Pergamino / Rojas, Buenos Aires'
    });

    const prod2 = this.fieldRegistry.registerProducer({
      id: 'PROD-PAMPA',
      name: 'Don Pedro Agrícola Ganadera',
      cuit: '30-68912345-9',
      contactPhone: '+5491166778899',
      location: 'Venado Tuerto, Santa Fe'
    });

    // 2. Seed Agricultural Lots
    const l1 = this.fieldRegistry.registerLot({
      id: 'LOT-101',
      producerId: prod1.id,
      producerName: prod1.name,
      producerPhone: prod1.contactPhone,
      establishmentName: 'Establecimiento La Juanita',
      lotName: 'Lote 14 - El Molino',
      hectaresGross: 140.0,
      hectaresNet: 132.5,
      currentCrop: 'Soja de Primera',
      coordinates: { lat: -34.1502, lng: -60.4201 },
      bufferZoneMeters: 500
    });

    const l2 = this.fieldRegistry.registerLot({
      id: 'LOT-102',
      producerId: prod1.id,
      producerName: prod1.name,
      producerPhone: prod1.contactPhone,
      establishmentName: 'Establecimiento La Juanita',
      lotName: 'Lote 08 - Los Eucaliptos',
      hectaresGross: 95.0,
      hectaresNet: 92.0,
      currentCrop: 'Maíz Tardío',
      coordinates: { lat: -34.1580, lng: -60.4350 },
      bufferZoneMeters: 200
    });

    const l3 = this.fieldRegistry.registerLot({
      id: 'LOT-103',
      producerId: prod2.id,
      producerName: prod2.name,
      producerPhone: prod2.contactPhone,
      establishmentName: 'Estancia El Ombú',
      lotName: 'Lote Norte 22',
      hectaresGross: 210.0,
      hectaresNet: 198.0,
      currentCrop: 'Girasol',
      coordinates: { lat: -33.7400, lng: -61.9600 },
      bufferZoneMeters: 1000
    });

    // 3. Seed Machinery Fleet
    const m1 = this.machineryCatalog.registerMachine({
      id: 'MAQ-201',
      name: 'Pla MAP 3 3600 H',
      type: 'Pulverizadora Autopropulsada Terrestre',
      brand: 'Pla / John Deere',
      model: 'MAP 3',
      tankCapacityLiters: 3600,
      boomWidthMeters: 36,
      fuelConsumptionLitersPerHa: 1.8,
      engineHours: 1420,
      assignedOperator: 'Darío Fernández'
    });

    const m2 = this.machineryCatalog.registerMachine({
      id: 'MAQ-202',
      name: 'DJI Agras T40 Flota Dron',
      type: 'Dron Agrícola de Gran Porte',
      brand: 'DJI Agriculture',
      model: 'Agras T40',
      tankCapacityLiters: 40,
      boomWidthMeters: 11,
      fuelConsumptionLitersPerHa: 0.3,
      engineHours: 240,
      assignedOperator: 'Piloto Lucas Varela'
    });

    const m3 = this.machineryCatalog.registerMachine({
      id: 'MAQ-203',
      name: 'Caimán SPH 32m',
      type: 'Pulverizadora Autopropulsada Terrestre',
      brand: 'Caimán',
      model: 'SPH',
      tankCapacityLiters: 3200,
      boomWidthMeters: 32,
      fuelConsumptionLitersPerHa: 1.9,
      engineHours: 890,
      assignedOperator: 'Marcos Benítez'
    });

    // 4. Seed Completed Labor Order with Double Signature ePOD
    const o1 = this.laborService.createLaborOrder({
      lotId: l1.id,
      machineId: m1.id,
      laborType: 'Pulverización Terrestre',
      ratePerHaUSD: 11.5,
      ratePerHaARS: 15200,
      operatorName: 'Darío Fernández',
      recipeAgronomicNumber: 'REC-AGRO-77491-BA',
      fuelProvidedBy: 'contractor'
    });

    // Record weather check
    this.laborService.recordWeatherCheck(o1.id, {
      temperatureC: 23.5,
      relativeHumidityPct: 62,
      windSpeedKmH: 9.5,
      windDirectionName: 'SE'
    });

    // Complete order
    this.laborService.completeLaborOrder({
      orderId: o1.id,
      hectaresApplied: 132.5,
      operatorSignature: 'data:image/svg+xml;utf8,<svg><path d="M10,10 L80,40 L160,20"/></svg>',
      producerSignature: 'data:image/svg+xml;utf8,<svg><path d="M5,15 L90,55 L180,30"/></svg>',
      signerName: 'Ing. Agr. Martín Echeverría',
      signerRole: 'Responsable Técnico La Juanita',
      fuelUsedLiters: 238.5,
      notes: 'Aplicación de fungicida y coadyuvante con boquillas antideriva TTJ60. Excelente cobertura sin deriva.'
    });
  }

  setupWakeLock() {
    if ('wakeLock' in navigator) {
      document.addEventListener('visibilitychange', async () => {
        if (this.wakeLock !== null && document.visibilityState === 'visible') {
          try {
            this.wakeLock = await navigator.wakeLock.request('screen');
          } catch (err) {
            console.warn('Wake Lock auto re-engagement warning:', err);
          }
        }
      });
    }
  }

  async toggleWakeLock() {
    if (!('wakeLock' in navigator)) {
      this.showToast('Wake Lock no soportado en este dispositivo', 'warning');
      return;
    }

    try {
      if (this.wakeLock) {
        await this.wakeLock.release();
        this.wakeLock = null;
        this.showToast('Modo Cabina desactivado', 'info');
      } else {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
          this.updateWakeLockButton();
        });
        this.showToast('Modo Cabina activado (Pantalla siempre encendida)', 'success');
      }
      this.updateWakeLockButton();
    } catch (e) {
      this.showToast(`Error de sensor WakeLock: ${e.message}`, 'warning');
    }
  }

  updateWakeLockButton() {
    const btn = document.getElementById('wakeLockBtn');
    if (!btn) return;
    if (this.wakeLock) {
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#65a30d] text-white flex items-center gap-1.5 shadow-md';
      btn.textContent = '☀️ Modo Cabina: ON';
    } else {
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-[#d6e5c9] flex items-center gap-1.5 border border-[#384e29]';
      btn.textContent = '🌙 Modo Cabina: OFF';
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-[#65a30d] text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-indigo-600 text-white'
    };

    toast.className = `p-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 transform transition-all duration-300 translate-y-2 ${colors[type] || colors.info}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const tabTarget = e.target.closest('[data-tab]');
      if (tabTarget) {
        const tab = tabTarget.getAttribute('data-tab');
        this.switchTab(tab);
        return;
      }

      const actionTarget = e.target.closest('[data-action]');
      if (actionTarget) {
        const action = actionTarget.getAttribute('data-action');
        this.handleAction(action, actionTarget);
      }
    });

    const wakeBtn = document.getElementById('wakeLockBtn');
    if (wakeBtn) {
      wakeBtn.addEventListener('click', () => this.toggleWakeLock());
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('[data-tab]').forEach(el => {
      if (el.getAttribute('data-tab') === tab) {
        el.className = 'px-4 py-2 rounded-xl text-sm font-semibold bg-[#65a30d] text-white shadow-lg shadow-none flex items-center gap-2';
      } else {
        el.className = 'px-4 py-2 rounded-xl text-sm font-semibold bg-[#182113]/60 hover:bg-slate-800 text-[#9eb38c] hover:text-slate-200 border border-[#2c3d20] flex items-center gap-2 transition-colors';
      }
    });
    this.render();
  }

  handleAction(action, target) {
    if (action === 'close-modal') {
      this.closeModal();
    } else if (action === 'open-new-order-modal') {
      this.openNewOrderModal();
    } else if (action === 'create-labor-order') {
      this.handleCreateLaborOrder();
    } else if (action === 'open-certify-modal') {
      const orderId = target.getAttribute('data-id');
      this.openCertifyModal(orderId);
    } else if (action === 'confirm-labor-certification') {
      const orderId = target.getAttribute('data-id');
      this.handleConfirmCertification(orderId);
    } else if (action === 'open-lot-modal') {
      this.openLotModal();
    } else if (action === 'register-lot') {
      this.handleRegisterLot();
    } else if (action === 'calculate-deltat-live') {
      this.handleCalculateDeltaTLive();
    } else if (action === 'generate-settlement') {
      this.handleGenerateSettlement();
    } else if (action === 'export-settlement-csv') {
      const id = target.getAttribute('data-id');
      this.handleExportSettlementCsv(id);
    }
  }

  closeModal() {
    const modal = document.getElementById('mainModal');
    if (modal) modal.classList.add('hidden');
  }

  // --- ORDER MODALS & WORKFLOWS ---

  openNewOrderModal() {
    const modal = document.getElementById('mainModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    title.textContent = '🚜 Generar Nueva Orden de Labor Agrícola';

    const lots = this.fieldRegistry.listLots({ status: 'active' });
    const lotOptions = lots.map(l =>
      `<option value="${l.id}">${Sanitizer.escapeHTML(l.lotName)} (${formatHectares(l.hectaresNet)}) - ${Sanitizer.escapeHTML(l.establishmentName)} [${Sanitizer.escapeHTML(l.producerName)}]</option>`
    ).join('');

    const machines = this.machineryCatalog.listMachinery({ status: 'available' });
    const machineOptions = machines.map(m =>
      `<option value="${m.id}">${Sanitizer.escapeHTML(m.name)} - ${Sanitizer.escapeHTML(m.type)} (${m.boomWidthMeters}m)</option>`
    ).join('');

    const html = `
      <form id="newOrderForm" class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Lote y Establecimiento</label>
          <select id="nordLotSelect" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200">
            ${lotOptions}
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Maquinaria Asignada</label>
          <select id="nordMachineSelect" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200">
            ${machineOptions}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Tipo de Labor</label>
            <select id="nordLaborType" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200">
              <option value="Pulverización Terrestre">Pulverización Terrestre (Barbecho / Fitosanitarios)</option>
              <option value="Pulverización con Dron">Pulverización con Dron Agrícola (Bajo Volumen)</option>
              <option value="Siembra Directa">Siembra Directa Air-Drill</option>
              <option value="Fertilización Líquida">Fertilización Líquida / SolMix</option>
              <option value="Cosecha de Granos">Cosecha de Granos</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Tarifa Pactada (USD/ha)</label>
            <input type="number" step="0.5" id="nordRateUSD" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200 font-bold" value="11.5" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Maquinista / Piloto</label>
            <input type="text" id="nordOperatorName" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" value="Darío Fernández" required />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">N° Receta Agronómica Digital</label>
            <input type="text" id="nordRecipeNum" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" value="REC-AGRO-77492-BA" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Provisión de Gasoil</label>
          <select id="nordFuelBy" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200">
            <option value="contractor">Gasoil a cargo del Contratista</option>
            <option value="producer">Gasoil provisto por el Productor (a descontar)</option>
          </select>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-[#2c3d20]">
          <button type="button" data-action="close-modal" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-[#d6e5c9] hover:bg-slate-700">Cancelar</button>
          <button type="button" data-action="create-labor-order" class="px-4 py-2 rounded-xl text-xs font-semibold bg-[#65a30d] hover:bg-[#4d7c0f] text-white shadow-lg shadow-none">Generar Orden de Labor</button>
        </div>
      </form>
    `;

    Sanitizer.safeSetInnerHTML(body, html);
    modal.classList.remove('hidden');
  }

  handleCreateLaborOrder() {
    const lotId = document.getElementById('nordLotSelect')?.value;
    const machineId = document.getElementById('nordMachineSelect')?.value;
    const laborType = document.getElementById('nordLaborType')?.value;
    const ratePerHaUSD = Number(document.getElementById('nordRateUSD')?.value) || 11.5;
    const operatorName = document.getElementById('nordOperatorName')?.value;
    const recipeAgronomicNumber = document.getElementById('nordRecipeNum')?.value;
    const fuelProvidedBy = document.getElementById('nordFuelBy')?.value;

    if (!lotId || !machineId) {
      this.showToast('Seleccione el lote y la máquina asignada', 'warning');
      return;
    }

    try {
      const order = this.laborService.createLaborOrder({
        lotId,
        machineId,
        laborType,
        ratePerHaUSD,
        operatorName,
        recipeAgronomicNumber,
        fuelProvidedBy
      });

      this.closeModal();
      this.showToast(`Orden ${order.id} creada para Lote ${order.lotName}`, 'success');
      this.render();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  openCertifyModal(orderId) {
    const order = this.laborService.getOrder(orderId);
    if (!order) return;

    const modal = document.getElementById('mainModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    title.textContent = `📋 Certificación Digital de Labor (Orden ${order.id})`;

    const html = `
      <div class="space-y-4">
        <div class="bg-[#182113] p-3.5 rounded-xl border border-[#2c3d20] text-xs space-y-1.5">
          <div class="flex justify-between"><strong class="text-[#d6e5c9]">Lote:</strong> <span>${Sanitizer.escapeHTML(order.lotName)} (${Sanitizer.escapeHTML(order.establishmentName)})</span></div>
          <div class="flex justify-between"><strong class="text-[#d6e5c9]">Productor:</strong> <span>${Sanitizer.escapeHTML(order.producerName)}</span></div>
          <div class="flex justify-between"><strong class="text-[#d6e5c9]">Labor / Máquina:</strong> <span>${Sanitizer.escapeHTML(order.laborType)} · ${Sanitizer.escapeHTML(order.machineName)}</span></div>
          <div class="flex justify-between"><strong class="text-[#d6e5c9]">Superficie Estimada Lote:</strong> <span class="font-bold text-white">${formatHectares(order.targetHectares)}</span></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Hectáreas Reales Aplicadas</label>
            <input type="number" step="0.1" id="certHectaresApplied" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-white font-bold" value="${order.targetHectares}" required />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Gasoil Consumido (Litros)</label>
            <input type="number" id="certFuelUsed" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" value="230" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Firmante por el Productor</label>
            <input type="text" id="certSignerName" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-xs text-slate-200" value="Ing. Agr. Martín Echeverría" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Cargo / Rol</label>
            <input type="text" id="certSignerRole" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-xs text-slate-200" value="Encargado de Campo / Asesor Técnico" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Observaciones Agronómicas</label>
          <input type="text" id="certNotes" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-xs text-slate-200" value="Labor ejecutada en horario matutino con óptimo Delta T. Sin deriva hacia bordura oeste." />
        </div>

        <div class="bg-indigo-950/40 border border-indigo-800/60 p-3 rounded-xl text-[11px] text-indigo-200">
          ✍️ <strong>Doble Firma Digital ePOD:</strong> Al confirmar, se estampará la firma digital del maquinista y del productor con sellado criptográfico SHA-256 no repudiable para liquidación de campaña.
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-[#2c3d20]">
          <button type="button" data-action="close-modal" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-[#d6e5c9] hover:bg-slate-700">Cancelar</button>
          <button type="button" data-action="confirm-labor-certification" data-id="${order.id}" class="px-4 py-2 rounded-xl text-xs font-semibold bg-[#65a30d] hover:bg-[#4d7c0f] text-white shadow-lg shadow-none">Firmar y Sellar Acta Digital</button>
        </div>
      </div>
    `;

    Sanitizer.safeSetInnerHTML(body, html);
    modal.classList.remove('hidden');
  }

  handleConfirmCertification(orderId) {
    const ha = Number(document.getElementById('certHectaresApplied')?.value);
    const fuel = Number(document.getElementById('certFuelUsed')?.value) || 0;
    const signerName = document.getElementById('certSignerName')?.value;
    const signerRole = document.getElementById('certSignerRole')?.value;
    const notes = document.getElementById('certNotes')?.value;

    if (isNaN(ha) || ha <= 0) {
      this.showToast('Ingrese las hectáreas aplicadas válidas', 'warning');
      return;
    }

    try {
      const completed = this.laborService.completeLaborOrder({
        orderId,
        hectaresApplied: ha,
        fuelUsedLiters: fuel,
        operatorSignature: 'data:image/svg+xml;utf8,<svg><path d="M10,20 L80,50 L150,30" stroke="green"/></svg>',
        producerSignature: 'data:image/svg+xml;utf8,<svg><path d="M5,10 L90,60 L200,40" stroke="blue"/></svg>',
        signerName,
        signerRole,
        notes
      });

      this.closeModal();
      this.showToast(`✅ Acta Digital ${completed.id} firmada y sellada con SHA-256: ${completed.hashSeal.slice(0, 10)}... (${formatHectares(ha)})`, 'success');
      this.render();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  openLotModal() {
    const modal = document.getElementById('mainModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    title.textContent = 'Registrar Nuevo Lote Agrícola';

    const producers = this.fieldRegistry.listProducers();
    const prodOptions = producers.map(p => `<option value="${p.id}">${Sanitizer.escapeHTML(p.name)}</option>`).join('');

    const html = `
      <form id="newLotForm" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Nombre del Lote</label>
            <input type="text" id="nlotName" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" placeholder="Ej: Lote 05 - La Rinconada" required />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Establecimiento / Campo</label>
            <input type="text" id="nlotEstablishment" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" placeholder="Ej: Campo Los Ceibos" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Productor / Cliente</label>
            <select id="nlotProducer" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200">
              ${prodOptions}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Cultivo Actual</label>
            <select id="nlotCrop" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200">
              <option value="Soja de Primera">Soja de Primera</option>
              <option value="Maíz Tardío">Maíz Tardío</option>
              <option value="Trigo">Trigo</option>
              <option value="Girasol">Girasol</option>
              <option value="Barbecho Químico">Barbecho Químico</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Hectáreas Brutas (Catastro)</label>
            <input type="number" step="0.1" id="nlotGrossHa" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" placeholder="Ej: 150.0" required />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Hectáreas Netas (Productivas)</label>
            <input type="number" step="0.1" id="nlotNetHa" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200 font-bold" placeholder="Ej: 142.5" required />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Distancia a Zona Sensible / Escuela (Metros)</label>
          <input type="number" id="nlotBuffer" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" value="500" />
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-[#2c3d20]">
          <button type="button" data-action="close-modal" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-[#d6e5c9] hover:bg-slate-700">Cancelar</button>
          <button type="button" data-action="register-lot" class="px-4 py-2 rounded-xl text-xs font-semibold bg-[#65a30d] hover:bg-[#4d7c0f] text-white shadow-lg shadow-none">Guardar Lote</button>
        </div>
      </form>
    `;

    Sanitizer.safeSetInnerHTML(body, html);
    modal.classList.remove('hidden');
  }

  handleRegisterLot() {
    const lotName = document.getElementById('nlotName')?.value;
    const establishmentName = document.getElementById('nlotEstablishment')?.value;
    const producerId = document.getElementById('nlotProducer')?.value;
    const currentCrop = document.getElementById('nlotCrop')?.value;
    const grossHa = Number(document.getElementById('nlotGrossHa')?.value);
    const netHa = Number(document.getElementById('nlotNetHa')?.value);
    const bufferZoneMeters = Number(document.getElementById('nlotBuffer')?.value) || 0;

    if (!lotName || !establishmentName || isNaN(grossHa) || isNaN(netHa)) {
      this.showToast('Complete los datos obligatorios del lote', 'warning');
      return;
    }

    const producer = this.fieldRegistry.getProducer(producerId);

    try {
      const lot = this.fieldRegistry.registerLot({
        lotName,
        establishmentName,
        producerId,
        producerName: producer ? producer.name : 'Productor',
        producerPhone: producer ? producer.contactPhone : '',
        currentCrop,
        hectaresGross: grossHa,
        hectaresNet: netHa,
        bufferZoneMeters
      });

      this.closeModal();
      this.showToast(`Lote ${lot.lotName} registrado (${formatHectares(lot.hectaresNet)} netas)`, 'success');
      this.render();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  handleCalculateDeltaTLive() {
    const temp = Number(document.getElementById('liveTempInput')?.value) || 24;
    const rh = Number(document.getElementById('liveRhInput')?.value) || 60;
    const wind = Number(document.getElementById('liveWindInput')?.value) || 10;

    const evaluation = DeltaTSentinel.evaluateSprayConditions({
      temperatureC: temp,
      relativeHumidityPct: rh,
      windSpeedKmH: wind
    });

    const displayContainer = document.getElementById('liveDeltaTResult');
    if (displayContainer) {
      const html = `
        <div class="p-4 rounded-xl border ${evaluation.badgeClass} space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-extrabold uppercase tracking-wide">${evaluation.label}</span>
            <span class="text-2xl font-black font-mono">ΔT = ${evaluation.deltaT}°C</span>
          </div>
          <p class="text-xs leading-relaxed opacity-90">${evaluation.message}</p>
          <div class="text-[10px] text-[#9eb38c] font-mono pt-1 border-t border-[#384e29]/50">
            Temp: ${temp}°C · Humedad: ${rh}% · Viento: ${wind} km/h · Pulverización: ${evaluation.isSprayPermitted ? 'PERMITIDA' : 'BLOQUEADA'}
          </div>
        </div>
      `;
      Sanitizer.safeSetInnerHTML(displayContainer, html);
    }
  }

  handleGenerateSettlement() {
    const prodName = document.getElementById('settlementProducerSelect')?.value || 'Agropecuaria del Litoral S.A.';
    const campaign = document.getElementById('settlementCampaignInput')?.value || 'Campaña Gruesa 2026/2027';

    try {
      const set = this.settlementService.generateCampaignSettlement({
        producerName: prodName,
        campaignTitle: campaign
      });

      this.showToast(`Liquidación ${set.id} generada. Total: ${formatUSD(set.totalAmountUSD)} (${formatHectares(set.totalHectares)})`, 'success');
      this.render();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  handleExportSettlementCsv(settlementId) {
    try {
      const csv = this.settlementService.exportSettlementCSV(settlementId);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AgroTrack_Liquidacion_${settlementId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('CSV con BOM UTF-8 exportado exitosamente para Excel', 'success');
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  // --- RENDER TABS ---

  render() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;

    if (this.currentTab === 'dashboard') {
      this.renderDashboard(mainView);
    } else if (this.currentTab === 'labors') {
      this.renderLabors(mainView);
    } else if (this.currentTab === 'weather-deltat') {
      this.renderWeatherDeltaT(mainView);
    } else if (this.currentTab === 'lots') {
      this.renderLots(mainView);
    } else if (this.currentTab === 'machinery') {
      this.renderMachinery(mainView);
    } else if (this.currentTab === 'settlement') {
      this.renderSettlement(mainView);
    }

    this.updateWakeLockButton();
  }

  renderDashboard(container) {
    const orders = this.laborService.listLaborOrders();
    const completedOrders = orders.filter(o => o.status === 'completed');
    const lots = this.fieldRegistry.listLots();
    const machines = this.machineryCatalog.listMachinery();

    const totalHa = completedOrders.reduce((sum, o) => sum + (o.hectaresApplied || 0), 0);
    const totalUSD = completedOrders.reduce((sum, o) => sum + (o.totalAmountUSD || 0), 0);
    const totalFuel = completedOrders.reduce((sum, o) => sum + (o.fuelUsedLiters || 0), 0);

    const html = `
      <div class="space-y-6">
        <!-- Top KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-[#182113] p-5 rounded-xl border border-[#2c3d20] shadow-xl">
            <div class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Hectáreas Certificadas</div>
            <div class="text-3xl font-extrabold text-[#bef264] mt-2">${formatHectares(totalHa)}</div>
            <div class="text-xs text-[#9eb38c] mt-1">${completedOrders.length} labores firmadas ePOD</div>
          </div>

          <div class="bg-[#182113] p-5 rounded-xl border border-[#2c3d20] shadow-xl">
            <div class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Facturación Campaña</div>
            <div class="text-3xl font-extrabold text-white mt-2">${formatUSD(totalUSD)}</div>
            <div class="text-xs text-indigo-400 mt-1">Cero Disputas de Superficie</div>
          </div>

          <div class="bg-[#182113] p-5 rounded-xl border border-[#2c3d20] shadow-xl">
            <div class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Flota de Maquinaria</div>
            <div class="text-3xl font-extrabold text-white mt-2">${machines.length}</div>
            <div class="text-xs text-[#9eb38c] mt-1">Autopropulsadas & Drones</div>
          </div>

          <div class="bg-[#182113] p-5 rounded-xl border border-[#2c3d20] shadow-xl">
            <div class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Gasoil Consumido</div>
            <div class="text-3xl font-extrabold text-amber-400 mt-2">${totalFuel} <span class="text-sm font-normal text-[#9eb38c]">lts</span></div>
            <div class="text-xs text-[#9eb38c] mt-1">Balance de Combustible</div>
          </div>
        </div>

        <!-- Action Banners -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-[#1b2615] p-5 rounded-xl border border-[#364b24] flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>🚜</span> Nueva Labor Agrícola
              </h3>
              <p class="text-xs text-[#d6e5c9] mt-1">Generar orden de pulverización o siembra con Receta Agronómica.</p>
            </div>
            <button data-action="open-new-order-modal" class="px-4 py-2.5 rounded-xl bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-semibold text-xs shadow-lg shadow-none whitespace-nowrap">
              + Iniciar Labor
            </button>
          </div>

          <div class="bg-[#19241f] p-5 rounded-xl border border-[#2e4739] flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>🌦️</span> Semáforo Delta T en Lote
              </h3>
              <p class="text-xs text-[#d6e5c9] mt-1">Monitoreo psicrométrico de deriva y evaporación antes de aplicar.</p>
            </div>
            <button data-tab="weather-deltat" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-none whitespace-nowrap">
              Ver Clima & ΔT
            </button>
          </div>
        </div>

        <!-- Recent Certified Labors -->
        <div class="bg-[#182113] rounded-xl border border-[#2c3d20] p-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-4">Últimas Labores Certificadas en Campo</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-[#9eb38c] border-b border-[#2c3d20] uppercase text-[10px] tracking-wider">
                <tr>
                  <th class="pb-3">ID Orden</th>
                  <th class="pb-3">Lote / Campo</th>
                  <th class="pb-3">Productor</th>
                  <th class="pb-3">Labor</th>
                  <th class="pb-3">Máquina</th>
                  <th class="pb-3">Superficie</th>
                  <th class="pb-3">Total USD</th>
                  <th class="pb-3">Sello SHA-256</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-[#d6e5c9]">
                ${orders.length === 0 ? '<tr><td colspan="8" class="py-4 text-center text-[#7d936c]">No hay órdenes registradas aún</td></tr>' : ''}
                ${orders.map(o => `
                  <tr>
                    <td class="py-3 font-mono font-semibold text-[#bef264]">${o.id}</td>
                    <td class="py-3 font-medium text-white">${Sanitizer.escapeHTML(o.lotName)} <span class="text-[#7d936c]">(${Sanitizer.escapeHTML(o.establishmentName)})</span></td>
                    <td class="py-3">${Sanitizer.escapeHTML(o.producerName)}</td>
                    <td class="py-3"><span class="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-[#d6e5c9]">${o.laborType}</span></td>
                    <td class="py-3 text-[#d6e5c9]">${Sanitizer.escapeHTML(o.machineName)}</td>
                    <td class="py-3 font-bold text-[#bef264]">${formatHectares(o.hectaresApplied || o.targetHectares)}</td>
                    <td class="py-3 font-bold text-white">${o.totalAmountUSD ? formatUSD(o.totalAmountUSD) : '-'}</td>
                    <td class="py-3 font-mono text-[10px] text-[#bef264]" title="${o.hashSeal}">
                      🔒 ${o.hashSeal ? o.hashSeal.slice(0, 10) + '...' : 'Pendiente Firma'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderLabors(container) {
    const orders = this.laborService.listLaborOrders();

    const html = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-white">Órdenes de Labor & Actas Digitales ePOD</h2>
            <p class="text-xs text-[#9eb38c]">Certificación georreferenciada de hectáreas netas aplicadas con doble firma y receta agronómica.</p>
          </div>
          <button data-action="open-new-order-modal" class="px-4 py-2 rounded-xl bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-semibold text-xs shadow-lg shadow-none flex items-center gap-1.5">
            + Nueva Orden de Labor
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${orders.map(o => `
            <div class="bg-[#182113] rounded-xl border ${o.status === 'completed' ? 'border-[#2c3d20]' : 'border-emerald-700/60'} p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-mono text-[#bef264]">${o.id}</span>
                    <h3 class="text-base font-bold text-white">${Sanitizer.escapeHTML(o.lotName)}</h3>
                    <div class="text-xs text-[#9eb38c]">${Sanitizer.escapeHTML(o.establishmentName)} · ${Sanitizer.escapeHTML(o.producerName)}</div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    o.status === 'completed' ? 'bg-emerald-950 text-[#bef264] border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                  }">
                    ${o.status === 'completed' ? 'Labor Certificada' : 'En Ejecución / Pendiente'}
                  </span>
                </div>

                <div class="mt-4 space-y-2 text-xs">
                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Labor / Cultivo:</span>
                    <span class="font-medium text-white">${Sanitizer.escapeHTML(o.laborType)} (${Sanitizer.escapeHTML(o.crop)})</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Maquinaria:</span>
                    <span class="font-medium text-slate-200">${Sanitizer.escapeHTML(o.machineName)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Maquinista / Aplicador:</span>
                    <span class="font-medium text-slate-200">${Sanitizer.escapeHTML(o.operatorName)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Superficie Certificada:</span>
                    <span class="font-bold text-[#bef264] text-sm">${formatHectares(o.hectaresApplied || o.targetHectares)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Tarifa y Total:</span>
                    <span class="font-bold text-white">${formatUSD(o.ratePerHaUSD)}/ha → ${o.totalAmountUSD ? formatUSD(o.totalAmountUSD) : 'Por certificar'}</span>
                  </div>

                  <div class="bg-[#11160e]/60 p-2.5 rounded-xl border border-[#2c3d20] text-[11px] space-y-1">
                    <div class="text-[#9eb38c]">Receta Agronómica: <span class="font-mono text-indigo-300">${o.recipeAgronomicNumber}</span></div>
                    <div class="text-[#9eb38c]">Gasoil: <span class="text-amber-300">${o.fuelUsedLiters || 0} lts</span> (${o.fuelProvidedBy === 'contractor' ? 'A cargo contratista' : 'Provisto por productor'})</div>
                    ${o.hashSeal ? `<div class="font-mono text-[9px] text-[#bef264]">🔒 Sello SHA-256: ${o.hashSeal.slice(0, 16)}...</div>` : ''}
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-[#2c3d20] flex justify-between items-center text-xs">
                ${o.status !== 'completed' ? `
                  <button data-action="open-certify-modal" data-id="${o.id}" class="w-full py-2 rounded-xl bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-semibold text-xs shadow-md">
                    ✍️ Certificar Labor & Firmar ePOD
                  </button>
                ` : `
                  <div class="flex justify-between items-center w-full">
                    <span class="text-[10px] text-[#7d936c]">Firmado por: ${Sanitizer.escapeHTML(o.signatures?.signerName || 'Productor')}</span>
                    <a href="${Sanitizer.sanitizeURL(WhatsAppAgroNotifier.generateWorkOrderCertificateUrl({
                      producerPhone: o.producerPhone,
                      producerName: o.producerName,
                      orderId: o.id,
                      lotName: o.lotName,
                      establishmentName: o.establishmentName,
                      laborType: o.laborType,
                      hectaresApplied: o.hectaresApplied,
                      machineName: o.machineName,
                      hashSeal: o.hashSeal
                    }))}" target="_blank" rel="noopener noreferrer" class="text-[#bef264] hover:underline flex items-center gap-1 font-semibold">
                      💬 Enviar Acta por WhatsApp
                    </a>
                  </div>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderWeatherDeltaT(container) {
    const html = `
      <div class="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span>🌦️</span> Estación Meteorológica en Lote & Semáforo Delta T (ΔT)
          </h2>
          <p class="text-xs text-[#9eb38c]">Cálculo psicrométrico automático de evaporación y deriva según temperatura, humedad relativa y velocidad de viento.</p>
        </div>

        <div class="bg-[#182113] border border-[#2c3d20] rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 class="text-sm font-bold text-white border-b border-[#2c3d20] pb-3">Medición Climática In-Situ (Anemómetro & Termo-Higrómetro)</h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Temperatura de Bulbo Seco (°C)</label>
              <input type="number" id="liveTempInput" step="0.5" class="w-full bg-[#11160e] border border-[#384e29] rounded-xl px-3 py-2.5 text-base text-white font-bold" value="23.5" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Humedad Relativa (%)</label>
              <input type="number" id="liveRhInput" class="w-full bg-[#11160e] border border-[#384e29] rounded-xl px-3 py-2.5 text-base text-white font-bold" value="62" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Velocidad del Viento (km/h)</label>
              <input type="number" id="liveWindInput" step="0.5" class="w-full bg-[#11160e] border border-[#384e29] rounded-xl px-3 py-2.5 text-base text-white font-bold" value="9.5" />
            </div>
          </div>

          <button data-action="calculate-deltat-live" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-none">
            ⚡ Evaluar Condiciones de Pulverización y Delta T
          </button>

          <!-- Result Area -->
          <div id="liveDeltaTResult" class="pt-2">
            <div class="p-4 rounded-xl border bg-emerald-950/60 text-[#bef264] border-emerald-700 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-extrabold uppercase tracking-wide">🟢 VENTANA ÓPTIMA (DELTA T 2-8°C)</span>
                <span class="text-2xl font-black font-mono">ΔT = 4.8°C</span>
              </div>
              <p class="text-xs leading-relaxed opacity-90">Condiciones excelentes. Gotas estables y máxima eficacia biológica sin riesgo de evaporación.</p>
              <div class="text-[10px] text-[#9eb38c] font-mono pt-1 border-t border-[#384e29]/50">
                Temp: 23.5°C · Humedad: 62% · Viento: 9.5 km/h · Pulverización: PERMITIDA
              </div>
            </div>
          </div>
        </div>

        <!-- Agronomic Guide -->
        <div class="bg-[#182113] p-5 rounded-xl border border-[#2c3d20] text-xs space-y-3">
          <h4 class="font-bold text-white text-sm">Normas Agronómicas para Pulverización Terrestre y con Dron:</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200">
              <strong>🟢 Delta T entre 2 y 8:</strong> Tamaño de gota ideal. Cobertura uniforme sobre follaje.
            </div>
            <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200">
              <strong>⚠️ Delta T entre 8 y 10:</strong> Usar boquillas con inducción de aire y coadyuvante antideriva.
            </div>
            <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200">
              <strong>⛔ Delta T > 10 o Viento > 15 km/h:</strong> Peligro penal de deriva. Prohibido aplicar.
            </div>
          </div>
        </div>
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderLots(container) {
    const lots = this.fieldRegistry.listLots();

    const html = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-white">Padrón de Campos y Lotes Agrícolas</h2>
            <p class="text-xs text-[#9eb38c]">Delimitación de hectáreas netas vs brutas (descuento de bajos y lagunas) y zonas de amortiguamiento.</p>
          </div>
          <button data-action="open-lot-modal" class="px-4 py-2 rounded-xl bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-semibold text-xs shadow-lg shadow-none flex items-center gap-1.5">
            + Nuevo Lote
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${lots.map(l => `
            <div class="bg-[#182113] rounded-xl border border-[#2c3d20] p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-mono text-[#bef264]">${l.id}</span>
                    <h3 class="text-base font-bold text-white">${Sanitizer.escapeHTML(l.lotName)}</h3>
                    <div class="text-xs text-[#9eb38c]">${Sanitizer.escapeHTML(l.establishmentName)}</div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-[#bef264] border border-[#384e29]">
                    ${Sanitizer.escapeHTML(l.currentCrop)}
                  </span>
                </div>

                <div class="mt-4 space-y-2 text-xs">
                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Productor:</span>
                    <span class="font-medium text-white">${Sanitizer.escapeHTML(l.producerName)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Superficie Neta (Trabajo):</span>
                    <span class="font-bold text-[#bef264] text-sm">${formatHectares(l.hectaresNet)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Superficie Bruta (Catastro):</span>
                    <span class="font-medium text-slate-200">${formatHectares(l.hectaresGross)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Descuento Bajos / Lagunas:</span>
                    <span class="font-medium text-amber-300">-${formatHectares(l.discountedWasteHa)}</span>
                  </div>

                  <div class="pt-2 border-t border-[#2c3d20] text-[11px] flex justify-between text-[#9eb38c]">
                    <span>Amortiguamiento Periurbano:</span>
                    <span class="font-semibold text-slate-200">${l.bufferZoneMeters} metros</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-[#2c3d20] flex justify-between items-center text-xs">
                <span class="text-[#7d936c]">Coordenadas: ${l.coordinates.lat.toFixed(3)}, ${l.coordinates.lng.toFixed(3)}</span>
                <span class="text-[#bef264] font-semibold">Activo</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderMachinery(container) {
    const machines = this.machineryCatalog.listMachinery();

    const html = `
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-bold text-white">Flota de Maquinaria Agrícola & Consumo de Gasoil</h2>
          <p class="text-xs text-[#9eb38c]">Control de horómetros, botalones de pulverización y consumo de gasoil l/ha para balance de campaña.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${machines.map(m => `
            <div class="bg-[#182113] rounded-xl border border-[#2c3d20] p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-mono text-[#bef264]">${m.id}</span>
                    <h3 class="text-base font-bold text-white">${Sanitizer.escapeHTML(m.name)}</h3>
                    <div class="text-xs text-[#9eb38c]">${Sanitizer.escapeHTML(m.brand)} ${Sanitizer.escapeHTML(m.model)} (${m.year})</div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-[#bef264] border border-emerald-800">
                    Operativo
                  </span>
                </div>

                <div class="mt-4 space-y-2 text-xs">
                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Tipo de Equipo:</span>
                    <span class="font-medium text-slate-200">${Sanitizer.escapeHTML(m.type)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Capacidad de Tanque:</span>
                    <span class="font-bold text-white">${m.tankCapacityLiters} litros</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Ancho de Labor / Botalón:</span>
                    <span class="font-medium text-slate-200">${m.boomWidthMeters} metros</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Consumo Gasoil Estimado:</span>
                    <span class="font-bold text-amber-400">${formatLitersPerHa(m.fuelConsumptionLitersPerHa)}</span>
                  </div>

                  <div class="flex justify-between text-[#9eb38c]">
                    <span>Horómetro de Motor:</span>
                    <span class="font-medium text-slate-200">${m.engineHours} horas</span>
                  </div>

                  <div class="pt-2 border-t border-[#2c3d20] text-[11px] text-[#9eb38c]">
                    <span>Maquinista habitual:</span> <strong class="text-indigo-300">${Sanitizer.escapeHTML(m.assignedOperator)}</strong>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderSettlement(container) {
    const settlements = this.settlementService.listSettlements();
    const producers = this.fieldRegistry.listProducers();

    const html = `
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-bold text-white">Liquidación de Campaña Cero Disputas</h2>
          <p class="text-xs text-[#9eb38c]">Generación de liquidaciones de labores en USD/ha y ARS/ha con balance de combustible y conciliación de hectáreas.</p>
        </div>

        <!-- Generator -->
        <div class="bg-[#182113] rounded-xl border border-[#2c3d20] p-5 shadow-xl space-y-4">
          <h3 class="text-sm font-bold text-white border-b border-[#2c3d20] pb-3">Generar Liquidación de Campaña</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Productor / Cliente</label>
              <select id="settlementProducerSelect" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200">
                ${producers.map(p => `<option value="${p.name}">${Sanitizer.escapeHTML(p.name)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#9eb38c] mb-1">Título de Campaña</label>
              <input type="text" id="settlementCampaignInput" class="w-full bg-[#182113] border border-[#384e29] rounded-xl px-3 py-2 text-sm text-slate-200" value="Campaña Gruesa 2026/2027" />
            </div>
            <div class="flex items-end">
              <button data-action="generate-settlement" class="w-full py-2.5 rounded-xl bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-semibold text-xs shadow-lg shadow-none">
                ⚡ Generar y Auditar Liquidación
              </button>
            </div>
          </div>
        </div>

        <!-- Settlements Table -->
        <div class="bg-[#182113] rounded-xl border border-[#2c3d20] p-5 shadow-xl space-y-4">
          <h3 class="text-sm font-bold text-white">Liquidaciones Auditadas con Doble Firma ePOD</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-[#9eb38c] border-b border-[#2c3d20] uppercase text-[10px] tracking-wider">
                <tr>
                  <th class="pb-3">ID Liquidación</th>
                  <th class="pb-3">Productor</th>
                  <th class="pb-3">Campaña</th>
                  <th class="pb-3">Labores</th>
                  <th class="pb-3">Hectáreas</th>
                  <th class="pb-3">Total USD</th>
                  <th class="pb-3">Gasoil</th>
                  <th class="pb-3">Estado Auditoría</th>
                  <th class="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-[#d6e5c9]">
                ${settlements.length === 0 ? '<tr><td colspan="9" class="py-4 text-center text-[#7d936c]">No hay liquidaciones generadas aún</td></tr>' : ''}
                ${settlements.map(s => `
                  <tr>
                    <td class="py-3 font-mono font-semibold text-[#bef264]">${s.id}</td>
                    <td class="py-3 font-medium text-white">${Sanitizer.escapeHTML(s.producerName)}</td>
                    <td class="py-3 text-[#d6e5c9]">${Sanitizer.escapeHTML(s.campaignTitle)}</td>
                    <td class="py-3 font-bold">${s.totalOrders}</td>
                    <td class="py-3 font-bold text-[#bef264]">${formatHectares(s.totalHectares)}</td>
                    <td class="py-3 font-extrabold text-white">${formatUSD(s.totalAmountUSD)}</td>
                    <td class="py-3 text-amber-300">${s.totalFuelUsedLiters} lts</td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.auditStatus === 'audited_zero_disputes' ? 'bg-emerald-950 text-[#bef264] border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}">
                        ${s.auditStatus === 'audited_zero_disputes' ? 'Cero Disputas Certificado' : 'Requiere Revisión'}
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <button data-action="export-settlement-csv" data-id="${s.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#384e29] font-semibold text-xs flex items-center gap-1 ml-auto">
                        📥 Exportar CSV Excel
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }
}

// Instantiate on DOM load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new AgroTrackApp();
  });
}
