/**
 * AgroTrack - Main SPA Controller
 * Contratistas Rurales, Pulverización Agrícola y Agro-Servicios
 * AppSec Zero-Trust, Offline-First Cache & Screen Wake Lock API Compliant
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
import {
  formatARS,
  formatUSD,
  formatHectares,
  formatLitersPerHa,
  formatDate,
  formatDateTime,
  evaluateDeltaTSafety
} from './utils/formatters.js';

const ICONS = {
  sun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  plus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  shieldCheck: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  cloudSun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 shrink-0" aria-hidden="true"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>',
  tractor: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 shrink-0" aria-hidden="true"><path d="m10 11 11 .9c.6 0 .9.5.8 1.1l-.8 5h-1"/><path d="M16 18h-5"/><path d="M18 5a1 1 0 0 0-1 1v5.573"/><path d="M3 4h9l1 7.246"/><path d="M4 11V4"/><path d="M7 15h.01"/><path d="M8 10.1V4"/><circle cx="18" cy="18" r="2"/><circle cx="7" cy="15" r="5"/></svg>',
  pen: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>',
  share: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'
};

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
    this.signaturePads = {};

    this.init();
  }

  init() {
    const restored = this.loadPersistedState();
    if (!restored) {
      this.seedDemoDataIfAllowed();
      this.persistState();
    }
    this.bindEvents();
    this.setupWakeLock();
    this.render();
  }

  loadPersistedState() {
    const saved = this.cache.loadState();
    if (!saved || typeof saved !== 'object') return false;

    try {
      this.fieldRegistry.producers.clear();
      this.fieldRegistry.lots.clear();
      this.machineryCatalog.machinery.clear();
      this.laborService.orders.clear();
      this.settlementService.settlements.clear();

      (saved.producers || []).forEach(p => this.fieldRegistry.producers.set(p.id, p));
      (saved.lots || []).forEach(l => this.fieldRegistry.lots.set(l.id, l));
      (saved.machinery || []).forEach(m => this.machineryCatalog.machinery.set(m.id, m));
      (saved.orders || []).forEach(o => this.laborService.orders.set(o.id, o));
      (saved.settlements || []).forEach(s => this.settlementService.settlements.set(s.id, s));
      return true;
    } catch (err) {
      console.warn('Restauración de caché local omitida:', err);
      return false;
    }
  }

  persistState() {
    this.cache.saveState({
      producers: this.fieldRegistry.listProducers(),
      lots: this.fieldRegistry.listLots(),
      machinery: this.machineryCatalog.listMachinery(),
      orders: this.laborService.listLaborOrders(),
      settlements: this.settlementService.listSettlements()
    });
  }

  hasDemoRecords() {
    const lots = this.fieldRegistry.listLots();
    const orders = this.laborService.listLaborOrders();
    const machines = this.machineryCatalog.listMachinery();
    return (
      lots.some(l => l.isDemo) ||
      orders.some(o => o.isDemo) ||
      machines.some(m => m.isDemo)
    );
  }

  seedDemoDataIfAllowed() {
    if (this.cache.isPurged()) return;

    const prod1 = this.fieldRegistry.registerProducer({
      id: 'PROD-LITORAL',
      name: 'Agropecuaria del Litoral S.A.',
      cuit: '30-71458920-4',
      contactPhone: '+5491144556677',
      location: 'Pergamino / Rojas, Buenos Aires'
    });
    prod1.isDemo = true;

    const prod2 = this.fieldRegistry.registerProducer({
      id: 'PROD-PAMPA',
      name: 'Don Pedro Agrícola Ganadera',
      cuit: '30-68912345-9',
      contactPhone: '+5491166778899',
      location: 'Venado Tuerto, Santa Fe'
    });
    prod2.isDemo = true;

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
    l1.isDemo = true;

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
    l2.isDemo = true;

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
    l3.isDemo = true;

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
    m1.isDemo = true;

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
    m2.isDemo = true;

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
    m3.isDemo = true;

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
    o1.isDemo = true;

    this.laborService.recordWeatherCheck(o1.id, {
      temperatureC: 23.5,
      relativeHumidityPct: 62,
      windSpeedKmH: 9.5,
      windDirectionName: 'SE'
    });

    this.laborService.completeLaborOrder({
      orderId: o1.id,
      hectaresApplied: 132.5,
      operatorSignature: 'DEMO-SEAL-OP-DARÍO-FERNÁNDEZ-SHA256-VERIFIED',
      producerSignature: 'DEMO-SEAL-PROD-MARTÍN-ECHEVERRÍA-SHA256-VERIFIED',
      signerName: 'Ing. Agr. Martín Echeverría',
      signerRole: 'Responsable Técnico La Juanita',
      fuelUsedLiters: 238.5,
      notes: 'Registro demostrativo inicial: aplicación con boquillas antideriva TTJ60.'
    });
  }

  handlePurgeDemoData() {
    this.cache.clear();
    this.fieldRegistry.producers.clear();
    this.fieldRegistry.lots.clear();
    this.machineryCatalog.machinery.clear();
    this.laborService.orders.clear();
    this.settlementService.settlements.clear();
    this.persistState();
    this.showToast('Datos de demostración purgados. Entorno limpio listo para operación.', 'info');
    this.render();
  }

  handleRestoreDemoData() {
    this.cache.setPurgeFlag(false);
    this.fieldRegistry.producers.clear();
    this.fieldRegistry.lots.clear();
    this.machineryCatalog.machinery.clear();
    this.laborService.orders.clear();
    this.settlementService.settlements.clear();
    this.seedDemoDataIfAllowed();
    this.persistState();
    this.showToast('Datos de demostración restaurados correctamente.', 'success');
    this.render();
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
      this.showToast('Wake Lock no soportado en este navegador. Mantenga la pantalla activa desde ajustes.', 'warning');
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
      this.showToast(`Aviso de sensor WakeLock: ${e.message}`, 'warning');
    }
  }

  updateWakeLockButton() {
    const btn = document.getElementById('wakeLockBtn');
    if (!btn) return;
    if (this.wakeLock) {
      btn.className = 'px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-bold bg-[#84cc16] text-[#0f1709] flex items-center gap-2 border border-[#a3e635] whitespace-nowrap shrink-0';
      Sanitizer.safeSetInnerHTML(btn, `${ICONS.sun}<span>Modo Cabina: ON</span>`);
    } else {
      btn.className = 'px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-semibold bg-[#202b18] hover:bg-[#29381e] text-[#c8dab8] flex items-center gap-2 border border-[#3b5228] whitespace-nowrap shrink-0';
      Sanitizer.safeSetInnerHTML(btn, `${ICONS.moon}<span>Modo Cabina: OFF</span>`);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const styles = {
      success: 'bg-[#84cc16] text-[#0f1709] border border-[#a3e635]',
      error: 'bg-[#4c0519] text-[#fecdd3] border border-[#be123c]',
      warning: 'bg-[#451a03] text-[#fde68a] border border-[#b45309]',
      info: 'bg-[#1d2817] text-[#f2f7ed] border border-[#3b5228]'
    };

    toast.className = `p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-200 pointer-events-auto ${styles[type] || styles.info}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 220);
    }, 4000);
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const modal = document.getElementById('mainModal');
      if (modal && !modal.classList.contains('hidden') && e.target === modal) {
        this.closeModal();
        return;
      }

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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('mainModal');
        if (modal && !modal.classList.contains('hidden')) {
          this.closeModal();
        }
      }
    });

    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!form || !form.id) return;

      if (form.id === 'newOrderForm') {
        e.preventDefault();
        this.handleCreateLaborOrder();
      } else if (form.id === 'certifyOrderForm') {
        e.preventDefault();
        const orderId = form.getAttribute('data-order-id');
        this.handleConfirmCertification(orderId);
      } else if (form.id === 'newLotForm') {
        e.preventDefault();
        this.handleRegisterLot();
      }
    });

    const wakeBtn = document.getElementById('wakeLockBtn');
    if (wakeBtn) {
      wakeBtn.addEventListener('click', () => this.toggleWakeLock());
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('header nav [data-tab]').forEach(el => {
      const isSelected = el.getAttribute('data-tab') === tab;
      el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      if (isSelected) {
        el.className = 'px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-bold bg-[#84cc16] text-[#0f1709] flex items-center gap-2 whitespace-nowrap shrink-0';
      } else {
        el.className = 'px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-semibold bg-[#182113] hover:bg-[#222e1b] text-[#c8dab8] hover:text-[#f2f7ed] border border-[#2c3d20] flex items-center gap-2 whitespace-nowrap shrink-0';
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
    } else if (action === 'clear-sig-canvas') {
      const padKey = target.getAttribute('data-pad');
      this.clearSignaturePad(padKey);
    } else if (action === 'trace-sig-canvas') {
      const padKey = target.getAttribute('data-pad');
      this.traceAssistedSignature(padKey);
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
    } else if (action === 'purge-demo-data') {
      this.handlePurgeDemoData();
    } else if (action === 'restore-demo-data') {
      this.handleRestoreDemoData();
    }
  }

  closeModal() {
    const modal = document.getElementById('mainModal');
    if (modal) modal.classList.add('hidden');
  }

  renderDemoBadge(isDemo) {
    if (!isDemo) return '';
    return '<span class="px-2 py-0.5 rounded text-xs font-bold bg-[#2e2611] text-[#fde68a] border border-[#856404]">[DEMO]</span>';
  }

  // --- SIGNATURE PAD ENGINE (HTML5 CANVAS) ---

  initSignaturePad(canvasId, padKey, strokeColor = '#bef264') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    const state = {
      canvas,
      ctx,
      drawing: false,
      points: [],
      strokeColor
    };
    this.signaturePads[padKey] = state;

    if (ctx) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    const getCoords = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const scaleX = canvas.width / (rect.width || canvas.width);
      const scaleY = canvas.height / (rect.height || canvas.height);
      return {
        x: Math.round((clientX - rect.left) * scaleX * 10) / 10,
        y: Math.round((clientY - rect.top) * scaleY * 10) / 10
      };
    };

    const startDraw = (ev) => {
      ev.preventDefault();
      state.drawing = true;
      const pt = getCoords(ev);
      state.points.push({ x: pt.x, y: pt.y, move: true });
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
      }
    };

    const moveDraw = (ev) => {
      if (!state.drawing) return;
      ev.preventDefault();
      const pt = getCoords(ev);
      state.points.push({ x: pt.x, y: pt.y, move: false });
      if (ctx) {
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    };

    const endDraw = () => {
      state.drawing = false;
    };

    canvas.addEventListener('pointerdown', startDraw);
    canvas.addEventListener('pointermove', moveDraw);
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointerleave', endDraw);
  }

  clearSignaturePad(padKey) {
    const pad = this.signaturePads[padKey];
    if (!pad) return;
    pad.points = [];
    if (pad.ctx && pad.canvas) {
      pad.ctx.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
    }
  }

  traceAssistedSignature(padKey) {
    const pad = this.signaturePads[padKey];
    if (!pad) return;
    this.clearSignaturePad(padKey);

    const samplePoints = padKey === 'operator'
      ? [
          { x: 18, y: 58, move: true },
          { x: 54, y: 24, move: false },
          { x: 88, y: 62, move: false },
          { x: 132, y: 30, move: false },
          { x: 182, y: 52, move: false },
          { x: 238, y: 36, move: false }
        ]
      : [
          { x: 22, y: 62, move: true },
          { x: 64, y: 28, move: false },
          { x: 108, y: 56, move: false },
          { x: 156, y: 22, move: false },
          { x: 204, y: 54, move: false },
          { x: 248, y: 40, move: false }
        ];

    pad.points = [...samplePoints];
    if (pad.ctx) {
      pad.ctx.beginPath();
      samplePoints.forEach(pt => {
        if (pt.move) pad.ctx.moveTo(pt.x, pt.y);
        else pad.ctx.lineTo(pt.x, pt.y);
      });
      pad.ctx.stroke();
    }
  }

  serializeSignaturePad(padKey) {
    const pad = this.signaturePads[padKey];
    if (!pad || pad.points.length < 2) return null;

    const d = pad.points
      .map(pt => `${pt.move ? 'M' : 'L'}${pt.x},${pt.y}`)
      .join(' ');
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 84"><path d="${d}" fill="none" stroke="${pad.strokeColor}" stroke-width="2"/></svg>`;
  }

  // --- ORDER MODALS & WORKFLOWS ---

  openNewOrderModal() {
    const modal = document.getElementById('mainModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    title.textContent = 'Generar Nueva Orden de Labor Agrícola';

    const lots = this.fieldRegistry.listLots({ status: 'active' });
    const machines = this.machineryCatalog.listMachinery({ status: 'available' });
    const canCreate = lots.length > 0 && machines.length > 0;

    const lotOptions = lots.length > 0
      ? lots.map(l =>
          `<option value="${l.id}">${Sanitizer.escapeHTML(l.lotName)} (${formatHectares(l.hectaresNet)}) - ${Sanitizer.escapeHTML(l.establishmentName)} [${Sanitizer.escapeHTML(l.producerName)}]</option>`
        ).join('')
      : '<option value="">Sin lotes activos registrados</option>';

    const machineOptions = machines.length > 0
      ? machines.map(m =>
          `<option value="${m.id}">${Sanitizer.escapeHTML(m.name)} - ${Sanitizer.escapeHTML(m.type)} (${m.boomWidthMeters}m)</option>`
        ).join('')
      : '<option value="">Sin maquinaria disponible en flota</option>';

    const html = `
      <form id="newOrderForm" class="space-y-4">
        ${!canCreate ? `
          <div class="p-3 rounded-lg bg-[#451a03] border border-[#b45309] text-xs text-[#fde68a] flex flex-wrap items-center justify-between gap-2">
            <span>Para crear una orden necesita al menos un lote activo y una máquina en flota.</span>
            <button type="button" data-action="restore-demo-data" class="px-3 py-1.5 min-h-[44px] rounded-lg bg-[#84cc16] text-[#0f1709] font-bold text-xs">
              Cargar Flota y Lotes Demo
            </button>
          </div>
        ` : ''}

        <div>
          <label for="nordLotSelect" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Lote y Establecimiento</label>
          <select id="nordLotSelect" ${!lots.length ? 'disabled' : ''} required class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]">
            ${lotOptions}
          </select>
        </div>

        <div>
          <label for="nordMachineSelect" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Maquinaria Asignada</label>
          <select id="nordMachineSelect" ${!machines.length ? 'disabled' : ''} required class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]">
            ${machineOptions}
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="nordLaborType" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Tipo de Labor</label>
            <select id="nordLaborType" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]">
              <option value="Pulverización Terrestre">Pulverización Terrestre (Barbecho / Fitosanitarios)</option>
              <option value="Pulverización con Dron">Pulverización con Dron Agrícola (Bajo Volumen)</option>
              <option value="Siembra Directa">Siembra Directa Air-Drill</option>
              <option value="Fertilización Líquida">Fertilización Líquida / SolMix</option>
              <option value="Cosecha de Granos">Cosecha de Granos</option>
            </select>
          </div>
          <div>
            <label for="nordRateUSD" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Tarifa Pactada (USD/ha)</label>
            <input type="number" step="0.5" min="0.5" id="nordRateUSD" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed] font-bold tabular-nums" value="11.5" required />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="nordOperatorName" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Maquinista / Piloto</label>
            <input type="text" id="nordOperatorName" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]" value="Darío Fernández" required />
          </div>
          <div>
            <label for="nordRecipeNum" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">N° Receta Agronómica Digital</label>
            <input type="text" id="nordRecipeNum" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed] font-mono" value="REC-AGRO-77492-BA" required />
          </div>
        </div>

        <div>
          <label for="nordFuelBy" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Provisión de Gasoil</label>
          <select id="nordFuelBy" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]">
            <option value="contractor">Gasoil a cargo del Contratista</option>
            <option value="producer">Gasoil provisto por el Productor (a descontar)</option>
          </select>
        </div>

        <div class="flex flex-wrap justify-end gap-3 pt-3 border-t border-[#29381e]">
          <button type="button" data-action="close-modal" class="px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold bg-[#202b18] text-[#c8dab8] hover:bg-[#29381e] border border-[#3b5228]">Cancelar</button>
          <button type="submit" ${!canCreate ? 'disabled' : ''} class="px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] disabled:opacity-50">Generar Orden de Labor</button>
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

      this.persistState();
      this.closeModal();
      this.showToast(`Orden ${order.id} creada para ${order.lotName}`, 'success');
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

    title.textContent = `Certificación Digital de Labor (${order.id})`;

    const html = `
      <form id="certifyOrderForm" data-order-id="${order.id}" class="space-y-4">
        <div class="pb-3 border-b border-[#29381e] text-xs space-y-1.5">
          <div class="flex justify-between gap-2"><strong class="text-[#9eb38c]">Lote:</strong> <span class="text-[#f2f7ed] font-medium">${Sanitizer.escapeHTML(order.lotName)} (${Sanitizer.escapeHTML(order.establishmentName)})</span></div>
          <div class="flex justify-between gap-2"><strong class="text-[#9eb38c]">Productor:</strong> <span class="text-[#f2f7ed]">${Sanitizer.escapeHTML(order.producerName)}</span></div>
          <div class="flex justify-between gap-2"><strong class="text-[#9eb38c]">Labor y Máquina:</strong> <span class="text-[#c8dab8]">${Sanitizer.escapeHTML(order.laborType)} | ${Sanitizer.escapeHTML(order.machineName)}</span></div>
          <div class="flex justify-between gap-2"><strong class="text-[#9eb38c]">Superficie Neta Lote:</strong> <span class="font-bold text-[#bef264] tabular-nums">${formatHectares(order.targetHectares)}</span></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="certHectaresApplied" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Hectáreas Reales Aplicadas</label>
            <input type="number" step="0.1" min="0.1" id="certHectaresApplied" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed] font-bold tabular-nums" value="${order.targetHectares}" required />
          </div>
          <div>
            <label for="certFuelUsed" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Gasoil Consumido (Litros)</label>
            <input type="number" step="0.5" min="0" id="certFuelUsed" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed] tabular-nums" value="230" required />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="certSignerName" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Firmante por el Productor</label>
            <input type="text" id="certSignerName" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]" value="Ing. Agr. Martín Echeverría" required />
          </div>
          <div>
            <label for="certSignerRole" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Cargo o Rol Técnico</label>
            <input type="text" id="certSignerRole" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]" value="Encargado de Campo / Asesor Técnico" required />
          </div>
        </div>

        <div>
          <label for="certNotes" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Observaciones Agronómicas</label>
          <input type="text" id="certNotes" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]" value="Labor ejecutada en ventana óptima de Delta T sin deriva." />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#29381e]">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-[#c8dab8]">Firma Maquinista</span>
              <div class="flex items-center gap-1">
                <button type="button" data-action="trace-sig-canvas" data-pad="operator" class="px-2 py-1 min-h-[44px] rounded text-xs font-semibold bg-[#243319] text-[#bef264] hover:bg-[#2f4221]">Trazar</button>
                <button type="button" data-action="clear-sig-canvas" data-pad="operator" class="px-2 py-1 min-h-[44px] rounded text-xs font-semibold bg-[#202b18] text-[#c8dab8] hover:bg-[#29381e]">Limpiar</button>
              </div>
            </div>
            <canvas id="operatorSigCanvas" width="280" height="84" aria-label="Panel de firma digital del maquinista" class="signature-canvas w-full h-[84px] bg-[#12180e] border border-[#3b5228] rounded-lg"></canvas>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-[#c8dab8]">Firma Productor / Agrónomo</span>
              <div class="flex items-center gap-1">
                <button type="button" data-action="trace-sig-canvas" data-pad="producer" class="px-2 py-1 min-h-[44px] rounded text-xs font-semibold bg-[#243319] text-[#bef264] hover:bg-[#2f4221]">Trazar</button>
                <button type="button" data-action="clear-sig-canvas" data-pad="producer" class="px-2 py-1 min-h-[44px] rounded text-xs font-semibold bg-[#202b18] text-[#c8dab8] hover:bg-[#29381e]">Limpiar</button>
              </div>
            </div>
            <canvas id="producerSigCanvas" width="280" height="84" aria-label="Panel de firma digital del productor" class="signature-canvas w-full h-[84px] bg-[#12180e] border border-[#3b5228] rounded-lg"></canvas>
          </div>
        </div>

        <p class="text-xs text-[#9eb38c] pt-1">
          Doble Firma Digital ePOD: Dibuje ambas firmas en los paneles táctiles (o pulse Trazar en cabina) para generar el sello criptográfico SHA-256 verificable.
        </p>

        <div class="flex flex-wrap justify-end gap-3 pt-3 border-t border-[#29381e]">
          <button type="button" data-action="close-modal" class="px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold bg-[#202b18] text-[#c8dab8] hover:bg-[#29381e] border border-[#3b5228]">Cancelar</button>
          <button type="submit" class="px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709]">Firmar y Sellar Acta Digital</button>
        </div>
      </form>
    `;

    Sanitizer.safeSetInnerHTML(body, html);
    modal.classList.remove('hidden');

    this.initSignaturePad('operatorSigCanvas', 'operator', '#bef264');
    this.initSignaturePad('producerSigCanvas', 'producer', '#a3e635');
    this.traceAssistedSignature('operator');
    this.traceAssistedSignature('producer');
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

    const operatorSignature = this.serializeSignaturePad('operator');
    const producerSignature = this.serializeSignaturePad('producer');

    if (!operatorSignature || !producerSignature) {
      this.showToast('Dibuje o trace ambas firmas digitales (Maquinista y Productor) antes de sellar el acta', 'warning');
      return;
    }

    try {
      const completed = this.laborService.completeLaborOrder({
        orderId,
        hectaresApplied: ha,
        fuelUsedLiters: fuel,
        operatorSignature,
        producerSignature,
        signerName,
        signerRole,
        notes
      });

      this.persistState();
      this.closeModal();
      this.showToast(`Acta Digital ${completed.id} sellada con SHA-256: ${completed.hashSeal.slice(0, 10)}... (${formatHectares(ha)})`, 'success');
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
    const hasProducers = producers.length > 0;
    const prodOptions = hasProducers
      ? producers.map(p => `<option value="${p.id}">${Sanitizer.escapeHTML(p.name)}</option>`).join('')
      : '<option value="PROD-GENERAL">Productor General (Nuevo)</option>';

    const html = `
      <form id="newLotForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="nlotName" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Nombre del Lote</label>
            <input type="text" id="nlotName" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]" placeholder="Ej: Lote 05 - La Rinconada" required />
          </div>
          <div>
            <label for="nlotEstablishment" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Establecimiento / Campo</label>
            <input type="text" id="nlotEstablishment" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]" placeholder="Ej: Campo Los Ceibos" required />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="nlotProducer" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Productor / Cliente</label>
            <select id="nlotProducer" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]">
              ${prodOptions}
            </select>
          </div>
          <div>
            <label for="nlotCrop" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Cultivo Actual</label>
            <select id="nlotCrop" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]">
              <option value="Soja de Primera">Soja de Primera</option>
              <option value="Maíz Tardío">Maíz Tardío</option>
              <option value="Trigo">Trigo</option>
              <option value="Girasol">Girasol</option>
              <option value="Barbecho Químico">Barbecho Químico</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="nlotGrossHa" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Hectáreas Brutas (Catastro)</label>
            <input type="number" step="0.1" min="0.1" id="nlotGrossHa" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed] tabular-nums" placeholder="Ej: 150.0" required />
          </div>
          <div>
            <label for="nlotNetHa" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Hectáreas Netas (Productivas)</label>
            <input type="number" step="0.1" min="0.1" id="nlotNetHa" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed] font-bold tabular-nums" placeholder="Ej: 142.5" required />
          </div>
        </div>

        <div>
          <label for="nlotBuffer" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Distancia a Zona Sensible / Escuela (Metros)</label>
          <input type="number" min="0" id="nlotBuffer" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed] tabular-nums" value="500" />
        </div>

        <div class="flex flex-wrap justify-end gap-3 pt-3 border-t border-[#29381e]">
          <button type="button" data-action="close-modal" class="px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold bg-[#202b18] text-[#c8dab8] hover:bg-[#29381e] border border-[#3b5228]">Cancelar</button>
          <button type="submit" class="px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709]">Guardar Lote</button>
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

    let producer = this.fieldRegistry.getProducer(producerId);
    if (!producer) {
      producer = this.fieldRegistry.registerProducer({
        id: 'PROD-GENERAL',
        name: 'Productor Agropecuario Registrado'
      });
    }

    try {
      const lot = this.fieldRegistry.registerLot({
        lotName,
        establishmentName,
        producerId: producer.id,
        producerName: producer.name,
        producerPhone: producer.contactPhone || '',
        currentCrop,
        hectaresGross: grossHa,
        hectaresNet: netHa,
        bufferZoneMeters
      });

      this.persistState();
      this.closeModal();
      this.showToast(`Lote ${lot.lotName} registrado (${formatHectares(lot.hectaresNet)} netas)`, 'success');
      this.render();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  renderDeltaTResultMarkup(evaluation) {
    return `
      <div class="p-4 rounded-xl border ${evaluation.badgeClass} space-y-2">
        <div class="flex flex-wrap justify-between items-center gap-2">
          <span class="text-sm font-extrabold uppercase tracking-wide">${Sanitizer.escapeHTML(evaluation.label)}</span>
          <span class="text-2xl font-black font-mono tabular-nums">ΔT = ${evaluation.deltaT}°C</span>
        </div>
        <p class="text-xs leading-relaxed">${Sanitizer.escapeHTML(evaluation.message)}</p>
        <div class="text-xs font-mono pt-2 border-t border-current/20 tabular-nums">
          Temp: ${evaluation.temperatureC}°C | Humedad: ${evaluation.relativeHumidityPct}% | Viento: ${evaluation.windSpeedKmH} km/h | Pulverización: ${evaluation.isSprayPermitted ? 'PERMITIDA' : 'BLOQUEADA'}
        </div>
      </div>
    `;
  }

  handleCalculateDeltaTLive() {
    const temp = Number(document.getElementById('liveTempInput')?.value) || 23.5;
    const rh = Number(document.getElementById('liveRhInput')?.value) || 62;
    const wind = Number(document.getElementById('liveWindInput')?.value) || 9.5;

    const evaluation = DeltaTSentinel.evaluateSprayConditions({
      temperatureC: temp,
      relativeHumidityPct: rh,
      windSpeedKmH: wind
    });

    const displayContainer = document.getElementById('liveDeltaTResult');
    if (displayContainer) {
      Sanitizer.safeSetInnerHTML(displayContainer, this.renderDeltaTResultMarkup(evaluation));
    }
  }

  handleGenerateSettlement() {
    const prodName = document.getElementById('settlementProducerSelect')?.value;
    const campaign = document.getElementById('settlementCampaignInput')?.value || 'Campaña Gruesa 2026/2027';

    if (!prodName) {
      this.showToast('Seleccione un productor con órdenes certificadas', 'warning');
      return;
    }

    try {
      const set = this.settlementService.generateCampaignSettlement({
        producerName: prodName,
        campaignTitle: campaign
      });

      this.persistState();
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

  renderDemoBanner() {
    const isDemoActive = this.hasDemoRecords();
    const isPurged = this.cache.isPurged();

    if (isDemoActive) {
      return `
        <div class="bg-[#2e2611] border border-[#856404] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div class="flex items-center gap-2.5 text-xs text-[#fde68a]">
            <span class="px-2 py-0.5 rounded font-bold bg-[#451a03] border border-[#b45309]">[DEMO]</span>
            <span>Datos de demostración precargados para inspección de lotes, flota y orden ePOD.</span>
          </div>
          <button type="button" data-action="purge-demo-data" class="px-3.5 py-2 min-h-[44px] rounded-lg bg-[#172012] hover:bg-[#243319] text-[#fde68a] border border-[#856404] font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
            ${ICONS.trash}
            <span>Purgar Datos Demo</span>
          </button>
        </div>
      `;
    }

    if (isPurged) {
      return `
        <div class="bg-[#172012] border border-[#29381e] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div class="text-xs text-[#c8dab8]">
            Entorno operativo limpio (datos de demostración purgados). Puede registrar lotes propios o restaurar el set de prueba.
          </div>
          <button type="button" data-action="restore-demo-data" class="px-3.5 py-2 min-h-[44px] rounded-lg bg-[#243319] hover:bg-[#2f4221] text-[#bef264] border border-[#3b5228] font-semibold text-xs whitespace-nowrap shrink-0">
            Restaurar Datos Demo
          </button>
        </div>
      `;
    }

    return '';
  }

  renderDashboard(container) {
    const orders = this.laborService.listLaborOrders();
    const completedOrders = orders.filter(o => o.status === 'completed');
    const machines = this.machineryCatalog.listMachinery();
    const hasDemo = this.hasDemoRecords();

    const totalHa = completedOrders.reduce((sum, o) => sum + (o.hectaresApplied || 0), 0);
    const totalUSD = completedOrders.reduce((sum, o) => sum + (o.totalAmountUSD || 0), 0);
    const totalFuel = completedOrders.reduce((sum, o) => sum + (o.fuelUsedLiters || 0), 0);

    const html = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-bold text-[#f2f7ed]">Panel General de Operaciones Agrícolas</h2>
            <p class="text-xs text-[#9eb38c]">Monitoreo de superficie neta trabajada, consumo de gasoil y actas digitales ePOD.</p>
          </div>
          ${this.renderDemoBadge(hasDemo)}
        </div>

        ${this.renderDemoBanner()}

        <!-- Top KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-[#172012] p-5 rounded-xl border border-[#29381e]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Hectáreas Certificadas</span>
              ${this.renderDemoBadge(hasDemo)}
            </div>
            <div class="text-2xl font-extrabold text-[#bef264] mt-2 tabular-nums">${formatHectares(totalHa)}</div>
            <div class="text-xs text-[#c8dab8] mt-1">${completedOrders.length} labores firmadas ePOD</div>
          </div>

          <div class="bg-[#172012] p-5 rounded-xl border border-[#29381e]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Facturación Campaña</span>
              ${this.renderDemoBadge(hasDemo)}
            </div>
            <div class="text-2xl font-extrabold text-[#f2f7ed] mt-2 tabular-nums">${formatUSD(totalUSD)}</div>
            <div class="text-xs text-[#bef264] mt-1">Superficie neta conciliada</div>
          </div>

          <div class="bg-[#172012] p-5 rounded-xl border border-[#29381e]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Flota de Maquinaria</span>
              ${this.renderDemoBadge(hasDemo)}
            </div>
            <div class="text-2xl font-extrabold text-[#f2f7ed] mt-2 tabular-nums">${machines.length}</div>
            <div class="text-xs text-[#c8dab8] mt-1">Autopropulsadas y Drones</div>
          </div>

          <div class="bg-[#172012] p-5 rounded-xl border border-[#29381e]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-[#9eb38c] uppercase tracking-wider">Gasoil Consumido</span>
              ${this.renderDemoBadge(hasDemo)}
            </div>
            <div class="text-2xl font-extrabold text-[#fde68a] mt-2 tabular-nums">${totalFuel} <span class="text-xs font-normal text-[#9eb38c]">lts</span></div>
            <div class="text-xs text-[#c8dab8] mt-1">Balance de Combustible</div>
          </div>
        </div>

        <!-- Action Banners -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-[#172012] p-5 rounded-xl border border-[#3b5228] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] flex items-center gap-2">
                ${ICONS.tractor}
                <span>Nueva Labor Agrícola</span>
              </h3>
              <p class="text-xs text-[#c8dab8] mt-1">Generar orden de pulverización o siembra con Receta Agronómica.</p>
            </div>
            <button type="button" data-action="open-new-order-modal" class="px-4 py-2.5 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
              ${ICONS.plus}
              <span>Iniciar Labor</span>
            </button>
          </div>

          <div class="bg-[#172012] p-5 rounded-xl border border-[#3b5228] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] flex items-center gap-2">
                ${ICONS.cloudSun}
                <span>Semáforo Delta T en Lote</span>
              </h3>
              <p class="text-xs text-[#c8dab8] mt-1">Monitoreo psicrométrico de deriva y evaporación antes de aplicar.</p>
            </div>
            <button type="button" data-tab="weather-deltat" class="px-4 py-2.5 min-h-[44px] rounded-lg bg-[#243319] hover:bg-[#2f4221] text-[#bef264] border border-[#3b5228] font-bold text-xs whitespace-nowrap shrink-0">
              Evaluar Clima y ΔT
            </button>
          </div>
        </div>

        <!-- Recent Certified Labors -->
        <div class="bg-[#172012] rounded-xl border border-[#29381e] p-5">
          <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] mb-4">Últimas Labores Registradas en Campo</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-[#9eb38c] border-b border-[#29381e] uppercase tracking-wider">
                <tr>
                  <th class="pb-3 pr-3">ID Orden</th>
                  <th class="pb-3 pr-3">Lote / Campo</th>
                  <th class="pb-3 pr-3">Productor</th>
                  <th class="pb-3 pr-3">Labor</th>
                  <th class="pb-3 pr-3">Máquina</th>
                  <th class="pb-3 pr-3">Superficie</th>
                  <th class="pb-3 pr-3">Total USD</th>
                  <th class="pb-3">Sello SHA-256</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#29381e] text-[#c8dab8]">
                ${orders.length === 0 ? `
                  <tr>
                    <td colspan="8" class="py-6 text-center text-[#9eb38c]">
                      No hay órdenes de labor registradas. Use el botón "Iniciar Labor" para registrar la primera orden.
                    </td>
                  </tr>
                ` : orders.map(o => `
                  <tr>
                    <td class="py-3 pr-3 font-mono font-semibold text-[#bef264] whitespace-nowrap">
                      ${Sanitizer.escapeHTML(o.id)} ${this.renderDemoBadge(o.isDemo)}
                    </td>
                    <td class="py-3 pr-3 font-medium text-[#f2f7ed]">${Sanitizer.escapeHTML(o.lotName)} <span class="text-[#9eb38c]">(${Sanitizer.escapeHTML(o.establishmentName)})</span></td>
                    <td class="py-3 pr-3">${Sanitizer.escapeHTML(o.producerName)}</td>
                    <td class="py-3 pr-3"><span class="px-2 py-0.5 rounded text-xs bg-[#243319] text-[#bef264] border border-[#3b5228]">${Sanitizer.escapeHTML(o.laborType)}</span></td>
                    <td class="py-3 pr-3 text-[#c8dab8]">${Sanitizer.escapeHTML(o.machineName)}</td>
                    <td class="py-3 pr-3 font-bold text-[#bef264] tabular-nums">${formatHectares(o.hectaresApplied || o.targetHectares)}</td>
                    <td class="py-3 pr-3 font-bold text-[#f2f7ed] tabular-nums">${o.totalAmountUSD ? formatUSD(o.totalAmountUSD) : '-'}</td>
                    <td class="py-3 font-mono text-xs text-[#bef264]" title="${o.hashSeal || ''}">
                      ${o.hashSeal ? `${o.hashSeal.slice(0, 10)}...` : 'Pendiente Firma'}
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
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#f2f7ed]">Órdenes de Labor y Actas Digitales ePOD</h2>
            <p class="text-xs text-[#9eb38c]">Certificación georreferenciada de hectáreas netas aplicadas con doble firma y receta agronómica.</p>
          </div>
          <button type="button" data-action="open-new-order-modal" class="px-4 py-2 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
            ${ICONS.plus}
            <span>Nueva Orden de Labor</span>
          </button>
        </div>

        ${orders.length === 0 ? `
          <div class="bg-[#172012] rounded-xl border border-[#29381e] p-8 text-center space-y-3">
            <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed]">Sin Órdenes de Labor Activas</h3>
            <p class="text-xs text-[#9eb38c] max-w-md mx-auto">Aún no se han emitido órdenes de pulverización, siembra o cosecha en esta campaña.</p>
            <div class="flex flex-wrap justify-center gap-3 pt-2">
              <button type="button" data-action="open-new-order-modal" class="px-4 py-2 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs">
                Crear Primera Orden de Labor
              </button>
              <button type="button" data-action="restore-demo-data" class="px-4 py-2 min-h-[44px] rounded-lg bg-[#243319] hover:bg-[#2f4221] text-[#bef264] border border-[#3b5228] font-semibold text-xs">
                Restaurar Datos Demo
              </button>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${orders.map(o => `
              <div class="bg-[#172012] rounded-xl border ${o.status === 'completed' ? 'border-[#29381e]' : 'border-[#3b5228]'} p-5 flex flex-col justify-between">
                <div>
                  <div class="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-[#bef264]">${Sanitizer.escapeHTML(o.id)}</span>
                        ${this.renderDemoBadge(o.isDemo)}
                      </div>
                      <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] mt-0.5">${Sanitizer.escapeHTML(o.lotName)}</h3>
                      <div class="text-xs text-[#9eb38c]">${Sanitizer.escapeHTML(o.establishmentName)} | ${Sanitizer.escapeHTML(o.producerName)}</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                      o.status === 'completed'
                        ? 'bg-[#052e16] text-[#bbf7d0] border border-[#166534]'
                        : 'bg-[#451a03] text-[#fde68a] border border-[#b45309]'
                    }">
                      ${o.status === 'completed' ? 'Labor Certificada' : 'En Ejecución / Pendiente'}
                    </span>
                  </div>

                  <div class="mt-4 space-y-2 text-xs">
                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Labor / Cultivo:</span>
                      <span class="font-medium text-[#f2f7ed]">${Sanitizer.escapeHTML(o.laborType)} (${Sanitizer.escapeHTML(o.crop)})</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Maquinaria:</span>
                      <span class="font-medium text-[#c8dab8]">${Sanitizer.escapeHTML(o.machineName)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Maquinista / Aplicador:</span>
                      <span class="font-medium text-[#c8dab8]">${Sanitizer.escapeHTML(o.operatorName)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Superficie Certificada:</span>
                      <span class="font-bold text-[#bef264] text-sm tabular-nums">${formatHectares(o.hectaresApplied || o.targetHectares)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Tarifa y Total:</span>
                      <span class="font-bold text-[#f2f7ed] tabular-nums">${formatUSD(o.ratePerHaUSD)}/ha -> ${o.totalAmountUSD ? formatUSD(o.totalAmountUSD) : 'Por certificar'}</span>
                    </div>

                    <div class="pt-3 mt-3 border-t border-[#29381e] text-xs space-y-1">
                      <div class="text-[#9eb38c]">Receta Agronómica: <span class="font-mono text-[#bef264]">${Sanitizer.escapeHTML(o.recipeAgronomicNumber)}</span></div>
                      <div class="text-[#9eb38c]">Gasoil: <span class="text-[#fde68a] font-semibold tabular-nums">${o.fuelUsedLiters || 0} lts</span> (${o.fuelProvidedBy === 'contractor' ? 'A cargo contratista' : 'Provisto por productor'})</div>
                      ${o.hashSeal ? `<div class="font-mono text-xs text-[#bef264]">Sello SHA-256: ${o.hashSeal.slice(0, 16)}...</div>` : ''}
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-[#29381e] flex justify-between items-center text-xs">
                  ${o.status !== 'completed' ? `
                    <button type="button" data-action="open-certify-modal" data-id="${o.id}" class="w-full py-2.5 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs flex items-center justify-center gap-2">
                      ${ICONS.pen}
                      <span>Certificar Labor y Firmar ePOD</span>
                    </button>
                  ` : `
                    <div class="flex flex-wrap justify-between items-center gap-2 w-full">
                      <span class="text-xs text-[#9eb38c]">Firmado por: ${Sanitizer.escapeHTML(o.signatures?.signerName || 'Productor')}</span>
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
                      }))}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 min-h-[44px] rounded-lg bg-[#243319] hover:bg-[#2f4221] text-[#bef264] border border-[#3b5228] flex items-center gap-1.5 font-semibold">
                        ${ICONS.share}
                        <span>Enviar Acta por WhatsApp</span>
                      </a>
                    </div>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderWeatherDeltaT(container) {
    const defaultEvaluation = DeltaTSentinel.evaluateSprayConditions({
      temperatureC: 23.5,
      relativeHumidityPct: 62,
      windSpeedKmH: 9.5
    });

    const html = `
      <div class="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 class="text-xl font-bold text-[#f2f7ed] flex items-center gap-2">
            ${ICONS.cloudSun}
            <span>Estación Meteorológica en Lote y Semáforo Delta T (ΔT)</span>
          </h2>
          <p class="text-xs text-[#9eb38c]">Cálculo psicrométrico automático de evaporación y deriva según temperatura, humedad relativa y velocidad de viento.</p>
        </div>

        <div class="bg-[#172012] border border-[#29381e] rounded-xl p-6 space-y-5">
          <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] border-b border-[#29381e] pb-3">Medición Climática In-Situ (Anemómetro y Termo-Higrómetro)</h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label for="liveTempInput" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Temperatura Bulbo Seco (°C)</label>
              <input type="number" id="liveTempInput" step="0.5" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-base text-[#f2f7ed] font-bold tabular-nums" value="23.5" />
            </div>

            <div>
              <label for="liveRhInput" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Humedad Relativa (%)</label>
              <input type="number" id="liveRhInput" min="1" max="100" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-base text-[#f2f7ed] font-bold tabular-nums" value="62" />
            </div>

            <div>
              <label for="liveWindInput" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Velocidad del Viento (km/h)</label>
              <input type="number" id="liveWindInput" step="0.5" min="0" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-base text-[#f2f7ed] font-bold tabular-nums" value="9.5" />
            </div>
          </div>

          <button type="button" data-action="calculate-deltat-live" class="w-full py-3 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-sm">
            Evaluar Condiciones de Pulverización y Delta T
          </button>
        </div>

        <!-- Result Area -->
        <div id="liveDeltaTResult">
          ${this.renderDeltaTResultMarkup(defaultEvaluation)}
        </div>

        <!-- Agronomic Guide -->
        <div class="bg-[#172012] p-5 rounded-xl border border-[#29381e] text-xs space-y-3">
          <h3 class="font-bold text-[#f2f7ed] text-[1.0625rem]">Normas Agronómicas para Pulverización Terrestre y con Dron</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#29381e]">
            <div class="space-y-1">
              <h4 class="font-bold text-[#bbf7d0] text-sm">Delta T entre 2°C y 8°C</h4>
              <p class="text-[#c8dab8]">Tamaño de gota ideal y evaporación controlada. Cobertura uniforme sobre el follaje.</p>
            </div>
            <div class="space-y-1">
              <h4 class="font-bold text-[#fde68a] text-sm">Delta T entre 8°C y 10°C</h4>
              <p class="text-[#c8dab8]">Margen crítico. Obligatorio usar boquillas con inducción de aire y coadyuvante antideriva.</p>
            </div>
            <div class="space-y-1">
              <h4 class="font-bold text-[#fecdd3] text-sm">Delta T > 10°C o Viento > 18 km/h</h4>
              <p class="text-[#c8dab8]">Peligro severo de deriva fitosanitaria o evaporación de gota. Prohibido aplicar.</p>
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
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-[#f2f7ed]">Padrón de Campos y Lotes Agrícolas</h2>
            <p class="text-xs text-[#9eb38c]">Delimitación de hectáreas netas vs brutas (descuento de bajos y lagunas) y zonas de amortiguamiento.</p>
          </div>
          <button type="button" data-action="open-lot-modal" class="px-4 py-2 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
            ${ICONS.plus}
            <span>Nuevo Lote</span>
          </button>
        </div>

        ${lots.length === 0 ? `
          <div class="bg-[#172012] rounded-xl border border-[#29381e] p-8 text-center space-y-3">
            <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed]">Sin Lotes Registrados en el Padrón</h3>
            <p class="text-xs text-[#9eb38c] max-w-md mx-auto">Registre el primer lote especificando superficie bruta catastral y superficie neta productiva.</p>
            <div class="flex flex-wrap justify-center gap-3 pt-2">
              <button type="button" data-action="open-lot-modal" class="px-4 py-2 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs">
                Registrar Primer Lote
              </button>
              <button type="button" data-action="restore-demo-data" class="px-4 py-2 min-h-[44px] rounded-lg bg-[#243319] hover:bg-[#2f4221] text-[#bef264] border border-[#3b5228] font-semibold text-xs">
                Restaurar Lotes Demo
              </button>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${lots.map(l => `
              <div class="bg-[#172012] rounded-xl border border-[#29381e] p-5 flex flex-col justify-between">
                <div>
                  <div class="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-[#bef264]">${Sanitizer.escapeHTML(l.id)}</span>
                        ${this.renderDemoBadge(l.isDemo)}
                      </div>
                      <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] mt-0.5">${Sanitizer.escapeHTML(l.lotName)}</h3>
                      <div class="text-xs text-[#9eb38c]">${Sanitizer.escapeHTML(l.establishmentName)}</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#243319] text-[#bef264] border border-[#3b5228]">
                      ${Sanitizer.escapeHTML(l.currentCrop)}
                    </span>
                  </div>

                  <div class="mt-4 space-y-2 text-xs">
                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Productor:</span>
                      <span class="font-medium text-[#f2f7ed]">${Sanitizer.escapeHTML(l.producerName)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Superficie Neta (Trabajo):</span>
                      <span class="font-bold text-[#bef264] text-sm tabular-nums">${formatHectares(l.hectaresNet)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Superficie Bruta (Catastro):</span>
                      <span class="font-medium text-[#c8dab8] tabular-nums">${formatHectares(l.hectaresGross)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Descuento Bajos / Lagunas:</span>
                      <span class="font-medium text-[#fde68a] tabular-nums">-${formatHectares(l.discountedWasteHa)}</span>
                    </div>

                    <div class="pt-2 border-t border-[#29381e] flex justify-between gap-2 text-[#9eb38c]">
                      <span>Amortiguamiento Periurbano:</span>
                      <span class="font-semibold text-[#c8dab8] tabular-nums">${l.bufferZoneMeters} metros</span>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-[#29381e] flex justify-between items-center text-xs">
                  <span class="text-[#9eb38c] font-mono tabular-nums">Coord: ${l.coordinates.lat.toFixed(3)}, ${l.coordinates.lng.toFixed(3)}</span>
                  <span class="text-[#bef264] font-semibold">Activo</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderMachinery(container) {
    const machines = this.machineryCatalog.listMachinery();

    const html = `
      <div class="space-y-4">
        <div>
          <h2 class="text-xl font-bold text-[#f2f7ed]">Flota de Maquinaria Agrícola y Consumo de Gasoil</h2>
          <p class="text-xs text-[#9eb38c]">Control de horómetros, botalones de pulverización y consumo de gasoil l/ha para balance de campaña.</p>
        </div>

        ${machines.length === 0 ? `
          <div class="bg-[#172012] rounded-xl border border-[#29381e] p-8 text-center space-y-3">
            <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed]">Sin Maquinaria Registrada en Flota</h3>
            <p class="text-xs text-[#9eb38c] max-w-md mx-auto">Restaure los equipos de demostración para visualizar pulverizadoras autopropulsadas y drones agrícolas.</p>
            <div class="pt-2">
              <button type="button" data-action="restore-demo-data" class="px-4 py-2 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs">
                Restaurar Flota Demo
              </button>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${machines.map(m => `
              <div class="bg-[#172012] rounded-xl border border-[#29381e] p-5 flex flex-col justify-between">
                <div>
                  <div class="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-[#bef264]">${Sanitizer.escapeHTML(m.id)}</span>
                        ${this.renderDemoBadge(m.isDemo)}
                      </div>
                      <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] mt-0.5">${Sanitizer.escapeHTML(m.name)}</h3>
                      <div class="text-xs text-[#9eb38c]">${Sanitizer.escapeHTML(m.brand)} ${Sanitizer.escapeHTML(m.model)} (${m.year})</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#052e16] text-[#bbf7d0] border border-[#166534]">
                      Operativo
                    </span>
                  </div>

                  <div class="mt-4 space-y-2 text-xs">
                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Tipo de Equipo:</span>
                      <span class="font-medium text-[#c8dab8]">${Sanitizer.escapeHTML(m.type)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Capacidad de Tanque:</span>
                      <span class="font-bold text-[#f2f7ed] tabular-nums">${m.tankCapacityLiters} litros</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Ancho de Labor / Botalón:</span>
                      <span class="font-medium text-[#c8dab8] tabular-nums">${m.boomWidthMeters} metros</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Consumo Gasoil Estimado:</span>
                      <span class="font-bold text-[#fde68a] tabular-nums">${formatLitersPerHa(m.fuelConsumptionLitersPerHa)}</span>
                    </div>

                    <div class="flex justify-between gap-2 text-[#9eb38c]">
                      <span>Horómetro de Motor:</span>
                      <span class="font-medium text-[#c8dab8] tabular-nums">${m.engineHours} horas</span>
                    </div>

                    <div class="pt-2 border-t border-[#29381e] text-xs text-[#9eb38c]">
                      <span>Maquinista asignado:</span> <strong class="text-[#bef264]">${Sanitizer.escapeHTML(m.assignedOperator)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    Sanitizer.safeSetInnerHTML(container, html);
  }

  renderSettlement(container) {
    const settlements = this.settlementService.listSettlements();
    const producers = this.fieldRegistry.listProducers();
    const hasProducers = producers.length > 0;

    const html = `
      <div class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-[#f2f7ed]">Liquidación de Campaña Cero Disputas</h2>
          <p class="text-xs text-[#9eb38c]">Generación de liquidaciones de labores en USD/ha y ARS/ha con balance de combustible y conciliación de hectáreas.</p>
        </div>

        <!-- Generator -->
        <div class="bg-[#172012] rounded-xl border border-[#29381e] p-5 space-y-4">
          <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed] border-b border-[#29381e] pb-3">Generar Liquidación de Campaña</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="settlementProducerSelect" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Productor / Cliente</label>
              <select id="settlementProducerSelect" ${!hasProducers ? 'disabled' : ''} class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]">
                ${hasProducers
                  ? producers.map(p => `<option value="${Sanitizer.escapeHTML(p.name)}">${Sanitizer.escapeHTML(p.name)}</option>`).join('')
                  : '<option value="">Sin productores registrados</option>'
                }
              </select>
            </div>
            <div>
              <label for="settlementCampaignInput" class="block text-xs font-semibold text-[#c8dab8] mb-1.5">Título de Campaña</label>
              <input type="text" id="settlementCampaignInput" class="w-full bg-[#12180e] border border-[#3b5228] rounded-lg px-3 py-2.5 text-sm text-[#f2f7ed]" value="Campaña Gruesa 2026/2027" />
            </div>
            <div class="flex items-end">
              <button type="button" data-action="generate-settlement" ${!hasProducers ? 'disabled' : ''} class="w-full py-2.5 min-h-[44px] rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#0f1709] font-bold text-xs disabled:opacity-50">
                Generar y Auditar Liquidación
              </button>
            </div>
          </div>
        </div>

        <!-- Settlements Table -->
        <div class="bg-[#172012] rounded-xl border border-[#29381e] p-5 space-y-4">
          <h3 class="text-[1.0625rem] font-bold text-[#f2f7ed]">Liquidaciones Auditadas con Doble Firma ePOD</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-[#9eb38c] border-b border-[#29381e] uppercase tracking-wider">
                <tr>
                  <th class="pb-3 pr-3">ID Liquidación</th>
                  <th class="pb-3 pr-3">Productor</th>
                  <th class="pb-3 pr-3">Campaña</th>
                  <th class="pb-3 pr-3">Labores</th>
                  <th class="pb-3 pr-3">Hectáreas</th>
                  <th class="pb-3 pr-3">Total USD</th>
                  <th class="pb-3 pr-3">Gasoil</th>
                  <th class="pb-3 pr-3">Estado Auditoría</th>
                  <th class="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#29381e] text-[#c8dab8]">
                ${settlements.length === 0 ? `
                  <tr>
                    <td colspan="9" class="py-6 text-center text-[#9eb38c]">
                      No hay liquidaciones generadas aún. Seleccione un productor con labores certificadas y pulse "Generar y Auditar Liquidación".
                    </td>
                  </tr>
                ` : settlements.map(s => `
                  <tr>
                    <td class="py-3 pr-3 font-mono font-semibold text-[#bef264]">${Sanitizer.escapeHTML(s.id)}</td>
                    <td class="py-3 pr-3 font-medium text-[#f2f7ed]">${Sanitizer.escapeHTML(s.producerName)}</td>
                    <td class="py-3 pr-3 text-[#c8dab8]">${Sanitizer.escapeHTML(s.campaignTitle)}</td>
                    <td class="py-3 pr-3 font-bold tabular-nums">${s.totalOrders}</td>
                    <td class="py-3 pr-3 font-bold text-[#bef264] tabular-nums">${formatHectares(s.totalHectares)}</td>
                    <td class="py-3 pr-3 font-extrabold text-[#f2f7ed] tabular-nums">${formatUSD(s.totalAmountUSD)}</td>
                    <td class="py-3 pr-3 text-[#fde68a] tabular-nums">${s.totalFuelUsedLiters} lts</td>
                    <td class="py-3 pr-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.auditStatus === 'audited_zero_disputes'
                          ? 'bg-[#052e16] text-[#bbf7d0] border border-[#166534]'
                          : 'bg-[#451a03] text-[#fde68a] border border-[#b45309]'
                      }">
                        ${s.auditStatus === 'audited_zero_disputes' ? 'Cero Disputas Certificado' : 'Requiere Revisión'}
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <button type="button" data-action="export-settlement-csv" data-id="${s.id}" class="px-3 py-2 min-h-[44px] rounded-lg bg-[#243319] hover:bg-[#2f4221] text-[#bef264] border border-[#3b5228] font-semibold text-xs inline-flex items-center gap-1.5 ml-auto">
                        ${ICONS.download}
                        <span>Exportar CSV Excel</span>
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

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new AgroTrackApp();
  });
}
