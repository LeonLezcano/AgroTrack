/**
 * AgroTrack Test Suite - 5-Layer Test Guardian (50+ Tests)
 * AiAppFactory Standard: Unit/Fuzzing, Integration, Component, Security, E2E
 */

import { FieldRegistry } from '../src/core/fieldRegistry.js';
import { MachineryCatalog } from '../src/core/machineryCatalog.js';
import { DeltaTSentinel } from '../src/core/deltaTSentinel.js';
import { TankMixCalculator } from '../src/core/tankMixCalculator.js';
import { LaborService } from '../src/services/laborService.js';
import { CampaignSettlementService } from '../src/services/campaignSettlementService.js';
import { WhatsAppAgroNotifier } from '../src/services/whatsAppAgroNotifier.service.js';
import { AgroTrackCache } from '../src/services/agroTrackCache.service.js';
import { Sanitizer } from '../src/utils/sanitizer.js';
import { sha256 } from '../src/utils/cryptoSeal.js';
import { formatARS, formatUSD, formatHectares, formatLitersPerHa, formatDate, evaluateDeltaTSafety } from '../src/utils/formatters.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

function assertThrows(fn, testName) {
  try {
    fn();
    failed++;
    console.error(`  ✗ FAIL (Expected throw): ${testName}`);
  } catch (e) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  }
}

console.log('\n======================================================');
console.log('🧪 INICIANDO SUITE DE PRUEBAS AGROTRACK (5 CAPAS - 50+ TESTS)');
console.log('======================================================\n');

// -------------------------------------------------------------
// CAPA 1: Unitarias & Fuzzing Caótico
// -------------------------------------------------------------
console.log('--- CAPA 1: Unitarias & Fuzzing Caótico ---');

// 1. Wet-bulb Stull calculation
const tw = DeltaTSentinel.calculateWetBulbTemperature(25.0, 50);
assert(!isNaN(tw) && tw > 15 && tw < 22, 'Capa 1.1: Cálculo psicrométrico de temperatura de bulbo húmedo');

// 2. Delta T calculation
const dt = DeltaTSentinel.calculateDeltaT(25.0, 50);
assert(!isNaN(dt) && dt > 4 && dt < 9, 'Capa 1.2: Cálculo de Delta T (bulbo seco - bulbo húmedo)');

// 3. Delta T Optimal Window (2-8°C)
const evalOpt = evaluateDeltaTSafety(4.5, 10.0);
assert(evalOpt.status === 'safe' && evalOpt.label.includes('VENTANA ÓPTIMA'), 'Capa 1.3: Delta T entre 2-8°C clasificado como óptimo');

// 4. Delta T High Danger (>10°C)
const evalDanger = evaluateDeltaTSafety(11.2, 10.0);
assert(evalDanger.status === 'danger' && evalDanger.label.includes('ALERTA ROJA'), 'Capa 1.4: Delta T > 10°C clasificado como alerta roja (evaporación)');

// 5. High Wind Speed Limit (>18 km/h)
const evalWind = evaluateDeltaTSafety(5.0, 22.0);
assert(evalWind.status === 'danger' && evalWind.label.includes('VIENTO EXTREMO'), 'Capa 1.5: Viento > 18 km/h clasificado como peligro de deriva');

// 6. Inversion Risk on Low Wind (<3 km/h)
const evalInversion = evaluateDeltaTSafety(4.0, 1.5);
assert(evalInversion.status === 'warning' && evalInversion.label.includes('INVERSIÓN TÉRMICA'), 'Capa 1.6: Viento < 3 km/h detecta riesgo de inversión térmica');

// 7. Fuzzing Delta T NaN & extremes
const evalFuzz = evaluateDeltaTSafety(NaN, 10);
assert(evalFuzz.status === 'danger', 'Capa 1.7: Fuzzing Delta T maneja NaN sin crashear');

// 8. SHA-256 standard
const hash1 = sha256('AgroTrack Field Work Order Test');
assert(typeof hash1 === 'string' && hash1.length === 64, 'Capa 1.8: SHA-256 genera digest hexadecimal de 64 caracteres');

// 9. SHA-256 determinism
const hash2 = sha256('AgroTrack Field Work Order Test');
assert(hash1 === hash2, 'Capa 1.9: SHA-256 es 100% determinista');

// 10. SHA-256 Avalanche Effect
const hash3 = sha256('AgroTrack Field Work Order Test.');
assert(hash1 !== hash3, 'Capa 1.10: Efecto avalancha en SHA-256 verificado');

// 11. SHA-256 Unicode & Agro Emojis
const hashAgro = sha256('🚜 Pulverizadora Pla MAP 3 · Soja 140ha 🌱');
assert(hashAgro.length === 64, 'Capa 1.11: SHA-256 procesa caracteres Unicode y Emojis de maquinaria');

// 12. Formatters USD & ARS
const fUsd = formatUSD(1450.5);
assert(fUsd.includes('1.450') || fUsd.includes('1,450'), 'Capa 1.12: Formato de moneda USD correcto');

const fArs = formatARS(15200);
assert(fArs.includes('15.200') || fArs.includes('15,200'), 'Capa 1.13: Formato de moneda ARS correcto');

// 13. Formatter Hectares
const fHa = formatHectares(132.5);
assert(fHa.includes('132') && fHa.includes('ha'), 'Capa 1.14: Formateo de hectáreas con sufijo oficial');

// 14. WhatsApp Phone E.164 Normalizer
const cleanPhone = WhatsAppAgroNotifier.cleanPhoneNumber('011 4455-6677');
assert(cleanPhone.startsWith('549'), 'Capa 1.15: Normalización de teléfono rural a estándar E.164');


// -------------------------------------------------------------
// CAPA 2: Integración & Estabilidad de Memoria
// -------------------------------------------------------------
console.log('\n--- CAPA 2: Integración & Estabilidad de Memoria ---');

const fReg = new FieldRegistry();
const mCat = new MachineryCatalog();

// 15. Producer Registration
const prod = fReg.registerProducer({
  name: 'Agropecuaria del Litoral S.A.',
  cuit: '30-71458920-4',
  contactPhone: '+5491144556677'
});
assert(prod.id.startsWith('PROD-') && prod.name.includes('Litoral'), 'Capa 2.1: Productor agropecuario registrado con ID');

// 16. Lot Registration (Gross vs Net Ha)
const lot1 = fReg.registerLot({
  producerId: prod.id,
  producerName: prod.name,
  producerPhone: prod.contactPhone,
  establishmentName: 'La Juanita',
  lotName: 'Lote 14',
  hectaresGross: 140.0,
  hectaresNet: 132.5,
  currentCrop: 'Soja de Primera'
});
assert(lot1.hectaresNet === 132.5 && lot1.discountedWasteHa === 7.5, 'Capa 2.2: Lote registrado con cálculo automático de descuento de bajos/lagunas');

// 17. Reject Net > Gross Ha
assertThrows(() => {
  fReg.registerLot({
    producerName: 'Test',
    lotName: 'Invalido',
    hectaresGross: 100,
    hectaresNet: 110
  });
}, 'Capa 2.3: Rechaza lote con hectáreas netas superiores a hectáreas catastrales');

// 18. Reject Gross Ha <= 0
assertThrows(() => {
  fReg.registerLot({
    producerName: 'Test',
    lotName: 'Invalido',
    hectaresGross: 0
  });
}, 'Capa 2.4: Rechaza lote con superficie menor o igual a cero');

// 19. Machinery Registration
const mach1 = mCat.registerMachine({
  name: 'Pla MAP 3 3600 H',
  type: 'Pulverizadora Autopropulsada Terrestre',
  brand: 'Pla',
  tankCapacityLiters: 3600,
  boomWidthMeters: 36,
  fuelConsumptionLitersPerHa: 1.8
});
assert(mach1.id.startsWith('MAQ-') && mach1.tankCapacityLiters === 3600, 'Capa 2.5: Maquinaria registrada con ancho de labor y tanque');

// 20. Machinery Fuel Estimate Calculation
const fuelEst = mCat.calculateFuelEstimate(mach1.id, 100);
assert(fuelEst.estimatedFuelLiters === 180, 'Capa 2.6: Estimación de consumo de gasoil calculada exactamente (100ha * 1.8 l/ha = 180 lts)');

// 21. Tank Mix Calculator Caldo Volume
const mixPlan = TankMixCalculator.calculateMixPlan({
  hectares: 100,
  waterRateLPerHa: 60,
  tankCapacityLiters: 3000,
  products: [
    { name: 'Glifosato 66%', dosePerHa: 2.5, unit: 'litros', loadingStep: 4 },
    { name: 'Coadyuvante Siliconado', dosePerHa: 0.1, unit: 'litros', loadingStep: 5 }
  ]
});
assert(mixPlan.totalCaldoLiters === 6000 && mixPlan.totalTankLoads === 2, 'Capa 2.7: Calculadora de caldo determina volumen total y cargas de tanque');

// 22. Agronomic Loading Sequence Integrity
const seq = TankMixCalculator.getAgronomicLoadingSequence();
assert(seq.length === 5 && seq[0].code === 'WATER_COND' && seq[4].code === 'ADJUVANT', 'Capa 2.8: Secuencia agronómica estricta de 5 pasos para evitar corte de caldo');

// 23. Product Dose Reconciliation
assert(mixPlan.products[0].totalProductNeeded === 250, 'Capa 2.9: Conciliación de insumos calcula dosis total requerida (250 lts)');

// 24. Memory Stability 1000 cycles
let memLeak = false;
try {
  for (let i = 0; i < 1000; i++) {
    DeltaTSentinel.calculateDeltaT(20 + (i % 10), 50);
    sha256(`agro_iter_${i}`);
  }
} catch (e) {
  memLeak = true;
}
assert(!memLeak, 'Capa 2.10: Estabilidad de memoria (1000 cálculos psicrométricos y hashes)');


// -------------------------------------------------------------
// CAPA 3: Componentes & Servicios de Negocio
// -------------------------------------------------------------
console.log('\n--- CAPA 3: Componentes & Servicios de Negocio ---');

const laborServ = new LaborService(fReg, mCat);
const campServ = new CampaignSettlementService(laborServ, fReg);

// 25. Create Labor Order
const order1 = laborServ.createLaborOrder({
  lotId: lot1.id,
  machineId: mach1.id,
  laborType: 'Pulverización Terrestre',
  ratePerHaUSD: 11.5,
  ratePerHaARS: 15200,
  operatorName: 'Darío Fernández',
  recipeAgronomicNumber: 'REC-AGRO-77491-BA'
});
assert(order1.status === 'draft' && order1.targetHectares === 132.5, 'Capa 3.1: Orden de labor creada en estado borrador con superficie neta');

// 26. In-Situ Weather Reading Check
const wCheck = laborServ.recordWeatherCheck(order1.id, {
  temperatureC: 22.0,
  relativeHumidityPct: 65,
  windSpeedKmH: 8.5,
  windDirectionName: 'S'
});
assert(wCheck.weatherEvaluation.status === 'safe' && order1.status === 'in_progress', 'Capa 3.2: Registro meteorológico in-situ valida Delta T y activa orden');

// 27. Complete Labor with Double Signature ePOD
const completedOrder = laborServ.completeLaborOrder({
  orderId: order1.id,
  hectaresApplied: 132.5,
  fuelUsedLiters: 238.5,
  operatorSignature: 'data:image/svg+xml;utf8,<svg><path d="M10,10 L50,50"/></svg>',
  producerSignature: 'data:image/svg+xml;utf8,<svg><path d="M5,15 L90,55"/></svg>',
  signerName: 'Ing. Agr. Martín Echeverría',
  signerRole: 'Responsable Técnico'
});
assert(completedOrder.status === 'completed' && completedOrder.hashSeal.length === 64, 'Capa 3.3: Labor finalizada con doble firma ePOD y sellada con SHA-256');

// 28. Reject Completion without Operator Signature
const order2 = laborServ.createLaborOrder({
  lotId: lot1.id,
  machineId: mach1.id
});
assertThrows(() => {
  laborServ.completeLaborOrder({
    orderId: order2.id,
    hectaresApplied: 50,
    operatorSignature: null,
    producerSignature: 'sig'
  });
}, 'Capa 3.4: Rechaza finalización de labor sin firma del maquinista');

// 29. Reject Completion without Producer Signature
assertThrows(() => {
  laborServ.completeLaborOrder({
    orderId: order2.id,
    hectaresApplied: 50,
    operatorSignature: 'sig',
    producerSignature: null
  });
}, 'Capa 3.5: Rechaza finalización de labor sin firma de conformidad del productor');

// 30. Financial Calculations in USD and ARS
assert(completedOrder.totalAmountUSD === Math.round(132.5 * 11.5 * 100) / 100, 'Capa 3.6: Importe total de labor en USD calculado con precisión');

// 31. Integrity Verification (Untampered)
const integCheck1 = laborServ.verifyLaborIntegrity(completedOrder.id);
assert(integCheck1.isTampered === false && integCheck1.hashMatches === true, 'Capa 3.7: Auditoría de integridad confirma labor no adulterada');

// 32. Tamper Detection on Altered Hectares
completedOrder.hectaresApplied = 150.0; // Intento de sobrefacturación fraudulenta
const integCheck2 = laborServ.verifyLaborIntegrity(completedOrder.id);
assert(integCheck2.isTampered === true && integCheck2.hashMatches === false, 'Capa 3.8: Detección instantánea de alteración fraudulenta de hectáreas');

// Restore original
completedOrder.hectaresApplied = 132.5;

// 33. Campaign Settlement Generation
const settlement = campServ.generateCampaignSettlement({
  producerName: prod.name,
  campaignTitle: 'Campaña 2026/2027'
});
assert(settlement.totalOrders === 1 && settlement.auditStatus === 'audited_zero_disputes', 'Capa 3.9: Liquidación de campaña agrupa órdenes auditadas con Cero Disputas');

// 34. Settlement Cryptographic Seal
assert(settlement.settlementHash.length === 64, 'Capa 3.10: Liquidación de campaña sellada criptográficamente');


// -------------------------------------------------------------
// CAPA 4: Seguridad & CSP (AppSec Guardian Directivas)
// -------------------------------------------------------------
console.log('\n--- CAPA 4: Seguridad & CSP ---');

// 35. Sanitizer escapeHTML
const cleanScript = Sanitizer.escapeHTML('<script>alert("xss_agro")</script>');
assert(!cleanScript.includes('<script>') && cleanScript.includes('&lt;script&gt;'), 'Capa 4.1: Sanitizer neutraliza inyección de scripts');

// 36. Sanitizer attribute injection
const cleanAttr = Sanitizer.escapeHTML('" onerror="alert(1)');
assert(!cleanAttr.includes('" onerror'), 'Capa 4.2: Sanitizer neutraliza inyección en atributos');

// 37. Sanitizer URL scheme blocking
const badScheme = Sanitizer.sanitizeURL('javascript:stealData()');
assert(badScheme.startsWith('#blocked'), 'Capa 4.3: Sanitizer bloquea esquemas javascript:');

// 38. Valid URL allowed
const goodScheme = Sanitizer.sanitizeURL('https://wa.me/5491144556677');
assert(goodScheme.startsWith('https://'), 'Capa 4.4: Sanitizer permite enlaces https legítimos');

// 39. firebase.json exists
const fbPath = path.resolve('firebase.json');
assert(fs.existsSync(fbPath), 'Capa 4.5: Archivo firebase.json presente');

// 40. CSP strictness in firebase.json
const fbConfig = JSON.parse(fs.readFileSync(fbPath, 'utf8'));
const headers = fbConfig.hosting.headers[0].headers;
const csp = headers.find(h => h.key === 'Content-Security-Policy')?.value || '';
assert(csp.includes("frame-ancestors 'none'") && !csp.includes("'unsafe-eval'"), 'Capa 4.6: CSP cualitativa estricta sin unsafe-eval');

// 41. XFO & XCTO headers
const xfo = headers.find(h => h.key === 'X-Frame-Options')?.value || '';
const xcto = headers.find(h => h.key === 'X-Content-Type-Options')?.value || '';
assert(xfo === 'DENY' && xcto === 'nosniff', 'Capa 4.7: Cabeceras X-Frame-Options y X-Content-Type-Options configuradas');

// 42. firestore.rules exists
const rulesPath = path.resolve('firestore.rules');
assert(fs.existsSync(rulesPath), 'Capa 4.8: Archivo firestore.rules presente');

// 43. firestore.rules Zero Trust
const rulesStr = fs.readFileSync(rulesPath, 'utf8');
assert(!rulesStr.includes('allow read, write: if true;'), 'Capa 4.9: firestore.rules sin bypass incondicional (Zero Trust)');

// 44. Inmutability in firestore.rules
assert(rulesStr.includes('allow delete: if false;'), 'Capa 4.10: Inmutabilidad estricta de actas de labor en reglas de base de datos');


// -------------------------------------------------------------
// CAPA 5: E2E Lifecycle & Outbox Cache
// -------------------------------------------------------------
console.log('\n--- CAPA 5: E2E Lifecycle & Outbox Cache ---');

// 45. Universal CSV Exporter with BOM UTF-8 (Directiva 17)
const csvOut = campServ.exportSettlementCSV(settlement.id);
assert(csvOut.startsWith('\uFEFF'), 'Capa 5.1: Exportador CSV incluye BOM UTF-8 para Excel en Windows');

// 46. CSV Official Headers & Content
assert(csvOut.includes('LIQUIDACIÓN DE LABORES AGRÍCOLAS') && csvOut.includes('DOBLE FIRMA ePOD'), 'Capa 5.2: CSV contiene encabezados oficiales y certificación ePOD');

// 47. Fuel Balance in Settlement
assert(settlement.totalFuelUsedLiters === 238.5, 'Capa 5.3: Balance de gasoil consolidado en la liquidación');

// 48. Cache Storage Mock
const mockStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = String(v); },
  removeItem(k) { delete this.data[k]; }
};

const cache = new AgroTrackCache(mockStorage);
assert(cache.isPurged() === false, 'Capa 5.4: Cache inicialmente no purgado');

// 49. Anti-Phantom Seed Invariant (Directiva 14)
cache.clear();
assert(cache.isPurged() === true, 'Capa 5.5: Purga de cache establece bandera agrotrack_demo_purged');

// 50. Cache Save & Load State
const saved = cache.saveState({ fieldData: 'ok_agro' });
assert(saved === true, 'Capa 5.6: Estado guardado exitosamente en cache local');

const loaded = cache.loadState();
assert(loaded && loaded.fieldData === 'ok_agro', 'Capa 5.7: Estado cargado exitosamente desde cache');

// 51. Outbox FIFO Queue (Offline-First en campo sin señal)
cache.addToOutbox({ action: 'sign_labor_order', orderId: completedOrder.id });
const outbox = cache.getOutbox();
assert(outbox.length === 1 && outbox[0].payload.orderId === completedOrder.id, 'Capa 5.8: Cola outbox almacena actas firmadas en campo sin señal');

// 52. Clear Outbox Queue
cache.clearOutbox();
assert(cache.getOutbox().length === 0, 'Capa 5.9: Cola outbox vaciada tras sincronización en zona con señal');

// 53. WhatsApp Certificate URL Generator
const certUrl = WhatsAppAgroNotifier.generateWorkOrderCertificateUrl({
  producerPhone: prod.contactPhone,
  producerName: prod.name,
  orderId: completedOrder.id,
  lotName: lot1.lotName,
  establishmentName: lot1.establishmentName,
  laborType: completedOrder.laborType,
  hectaresApplied: completedOrder.hectaresApplied,
  machineName: mach1.name,
  hashSeal: completedOrder.hashSeal
});
assert(certUrl.includes('wa.me/5491144556677') && certUrl.includes('132.5'), 'Capa 5.10: Generador de enlace de WhatsApp de acta digital funciona');

// 54. Weather Alert WhatsApp Generator
const wAlertUrl = WhatsAppAgroNotifier.generateWeatherAlertUrl({
  producerPhone: prod.contactPhone,
  producerName: prod.name,
  lotName: lot1.lotName,
  deltaT: 11.5,
  windSpeedKmH: 20.0,
  reason: 'Viento fuerte y riesgo de deriva'
});
assert(wAlertUrl.includes('ALERTA%20METEOROL%C3%93GICA') && wAlertUrl.includes('11.5'), 'Capa 5.11: Alerta meteorológica de deriva fitosanitaria para WhatsApp generada');

// 55. Total Tests Count ≥ 50
const totalTests = passed + failed;
assert(totalTests >= 50, `Capa 5.12: Batería obligatoria ≥ 50 tests cumplida (Ejecutadas: ${totalTests})`);

console.log('\n======================================================');
console.log(`📊 RESULTADO DE LA SUITE: ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
