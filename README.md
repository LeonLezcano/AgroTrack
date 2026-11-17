# 🚜 AgroTrack | Plataforma Operativa y Cero Disputas para Contratistas Rurales y Agro-Servicios

> **AiAppFactory Standard · Versión v1.0.02**  
> *Gestión de Labores de Campo, Pulverización Terrestre/Aérea/Dron, Semáforo Meteorológico Delta T y Liquidación Transparente de Campañas.*

---

## 🛠️ Novedades v1.0.02 (Remediación Integral UX/UI, Accesibilidad y Offline-First)

- **Sistema de Diseño de Cabina (`DESIGN.md`):** Paleta oscura de alto contraste oliva/lima (`#11160e` / `#172012` / `#84cc16` con texto `#0f1709`, relación 9.8:1 AAA) optimizada para tablets de cabina y smartphones en campo, sin clases residuales `slate`/`indigo`/`blue`.
- **Tailwind CSS Compilado Localmente y PWA 100% Offline-First:** Eliminación del CDN en tiempo de ejecución (`cdn.tailwindcss.com`), hoja compilada `./styles.css`, `manifest.json` dedicado, registro modular `./src/sw-register.js`, y `sw.js` (`agrotrack-cache-v1.0.02`) con estrategia híbrida y precaché real de módulos.
- **Doble Firma Digital ePOD en HTML5 `<canvas>`:** Paneles táctiles interactivos para firma del maquinista y del productor/agrónomo con serialización vectorial y sellado criptográfico SHA-256.
- **Transparencia de Datos Demo y Persistencia Local:** Etiquetado explícito `[DEMO]` en lotes, maquinaria y órdenes precargadas, controles de purga (`Purgar Datos Demo`) y restauración en interfaz, y persistencia conectada a `AgroTrackCache.saveState()` / `loadState()`.
- **Accesibilidad WCAG 2.1 AA y Teclado:** Áreas táctiles mínimas de `44x44px`, cierre de modales con `Escape` y clic en fondo, atributos `role="dialog" aria-modal="true"`, pestañas con `role="tablist"` / `role="tab"` / `aria-selected`, asociaciones `<label for="...">` en todos los formularios, `:focus-visible` de alto contraste, `@media (prefers-reduced-motion: reduce)` y `@media print`.

---

## 🌾 La Problemática del Sector

Los contratistas rurales y empresas de pulverización agrícola enfrentan cuatro focos críticos de fricción operativa y pérdidas financieras:
1. **Disputas de Hectáreas Facturadas vs Catastrales:** Diferencias de criterio entre hectáreas netas aplicadas vs brutas de alambrado (descuento de bajos, cañadas, lagunas y montes) que demoran cobranzas y erosionan la rentabilidad.
2. **Riesgo Penal por Deriva Fitosanitaria:** Exigencias de recetas agronómicas y condiciones meteorológicas estrictas. Aplicar con $\Delta T$ fuera de rango o ráfagas de viento provoca multas, clausuras y daños colaterales a cultivos linderos.
3. **Corte de Caldo y Pérdida de Insumos:** Incompatibilidad física y química por orden de carga erróneo en tanque, destruyendo miles de dólares en fitosanitarios por hectárea.
4. **Descontrol de Combustible y Falta de Respaldo Inmutable:** Discusiones sobre quién absorbe el gasoil consumido en labores contratadas a destajo o paquete cerrado.

---

## ⚡ Soluciones Arquitectónicas Implementadas en AgroTrack

### 1. 📐 Acta Digital de Labor Georreferenciada con Hectáreas Netas vs Brutas
- Catálogo de campos y lotes georreferenciados con superficie bruta catastral, polígonos no trabajables (lagunas, bajos salinos) y **hectáreas netas auditadas**.
- Trazabilidad de tipo de labor (pulverización, siembra, cosecha, fertilización) y cultivo implantado.

### 2. ✍️ Doble Firma ePOD Inmutable con Hash Criptográfico SHA-256
- Cada labor se cierra con firma digital del **Maquinista / Operador de Cabina** y firma en conformidad del **Productor o Ingeniero Agrónomo del Campo**.
- Generación de sello criptográfico SHA-256 inmutable que detecta adulteraciones de hectáreas, fecha o dosis.

### 3. 🌦️ Semáforo Meteorológico Psicrométrico en Lote ($\Delta T$)
- Cálculo agronómico en tiempo real de temperatura de bulbo húmedo y **Delta T** ($\Delta T = T_{seco} - T_{húmedo}$).
- Semáforo tri-color estricto:
  - 🟢 **Óptima (2°C – 8°C):** Gota estable, evaporación controlada, máxima penetración foliar.
  - ⚠️ **Marginal (8°C – 10°C):** Gotas propensas a evaporación rápida. Requiere boquillas con inducción de aire y coadyuvante antideriva.
  - ⛔ **Peligro (> 10°C o Viento > 15 km/h o < 2°C con rocío):** Prohibido pulverizar. Alerta roja bloqueante para prevención de sanciones ambientales.

### 4. 🧪 Calculadora de Caldo de Tanque y Secuencia de Mezcla
- Algoritmo de 5 pasos agronómicos obligatorios:
  1. Acondicionador de agua / Corrector de pH y secuestrante de cationes.
  2. Polvos mojables (WP) y gránulos dispersables (WDG).
  3. Suspensiones concentradas (SC) y suspensiones de encapsulado (CS).
  4. Concentrados emulsionables (EC).
  5. Coadyuvantes, aceites metilados y surfactantes.
- Conciliación de dosis por hectárea, capacidad de tanque ($l$) y bidones de producto requeridos.

### 5. 💰 Liquidación B2B de Campaña & Exportación Universal CSV
- Liquidaciones consolidadas por productor y campaña en USD/ha y ARS/ha.
- Conciliación estricta de gasoil consumido ($l/ha$).
- Exportación nativa vía `Blob` con prefijo **BOM UTF-8 (`\uFEFF`)** para apertura limpia en Microsoft Excel en Windows sin librerías pesadas (Directiva Inquebrantable 17).

### 6. 📱 Operatividad Callejera y Modo Cabina (Screen Wake Lock API)
- Diseñada prioritariamente para smartphones y tablets de cabina de tractor/pulverizadora.
- Botones táctiles cómodos $\ge 44\times 44$ px.
- Soporte de pantalla encendida continua (`navigator.wakeLock`) para monitoreo continuo en soporte de parabrisas con reconexión automática ante cambios de visibilidad (`visibilitychange`).

---

## 🧪 Arnés de Pruebas Multi-Capa (57 Tests en 5 Capas)

Ejecutar la suite completa:
```bash
node tests/run_tests.js
```

1. **Capa 1 (Unitarias & Algoritmos):** Cálculo psicrométrico de Stull, Delta T, secuencias de caldo, cálculo de hectáreas netas vs brutas.
2. **Capa 2 (Integración & Sincronización):** Creación de órdenes, doble firma, sellado criptográfico SHA-256, liquidaciones B2B y cálculo de gasoil.
3. **Capa 3 (Componentes & DOM):** Renderizado reactivo, inputs meteorológicos, prevención de XSS y formato monetario.
4. **Capa 4 (Seguridad Estricta & AppSec):** Auditoría AppSec Guardian 100/100, CSP estricta, zero-sink DOM sanitization, RBAC en Firestore Rules.
5. **Capa 5 (E2E & Ciclo de Vida):** Flujo completo de siembra de lote, orden de pulverización, firma ePOD, liquidación y exportación de reporte.

---

## 🛡️ Auditoría de Seguridad

```bash
node ../AiAppFactory/tools/security-guardian/index.mjs .
```
- **Puntaje:** 100 / 100
- **Vulnerabilidades:** 0 Críticas | 0 Altas | 0 Medias | 0 Bajas.

---

## 🚀 Despliegue & Ejecución

```bash
# Desarrollo local
python -m http.server 5215

# Abrir en navegador
http://localhost:5215
```

---

*Desarrollado con rigor agronómico y tecnológico bajo los estándares de AiAppFactory.*
