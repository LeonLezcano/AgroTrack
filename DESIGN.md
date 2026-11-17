# AgroTrack — Design System & Visual Direction

> **Mode:** Operate (Precision Tractor-Cabin & Field Instrumentation)  
> **Dial:** ENERGY 4 / RHYTHM 3 / MOTION 2  
> **Target Devices:** Tractor/sprayer cabin tablets (7"–11"), rugged field smartphones (`393x852`), and contractor dispatch desktops.

---

## 1. Competitive Benchmarking & Industry Scene

| Referent | Surface Approach | Primary Action Signal | Key Lesson Applied to AgroTrack |
| :--- | :--- | :--- | :--- |
| **John Deere Operations Center** | Deep charcoal instrument panels, muted borders | High-visibility agronomic green/yellow | High legibility under cab glare and night operations without harsh white screens |
| **Climate FieldView** | Scannable field/lot telemetry cards, crisp numeric KPIs | Saturated lime/amber/red status signals | Tabular numeric alignment and instant pass/caution/stop weather readouts |
| **Granular** | Clean table density, structured campaign settlement ledgers | Clear primary CTA + secondary outline actions | Zero-clutter billing and hectares reconciliation tables |

**Why dark olive-slate cabin surfaces?**  
Spraying operators and rural contractors work in tractor cabins from dawn through dusk and into night shifts. A deep olive-charcoal surface (`#11160e` / `#172012`) eliminates cabin windshield glare at night while keeping a strong agronomic identity distinct from generic blue/violet SaaS templates.

---

## 2. Color Tokens

Strict 2-core + 1-accent + olive-neutral palette (zero stray `slate`, `indigo`, or `blue` utility classes):

### Olive-Neutral Surfaces & Ink
| Token | Hex | Role | Contrast on `#172012` |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#11160e` | Viewport background | — |
| `--bg-surface` | `#172012` | Header, cards, modals | — |
| `--bg-elevated` | `#1d2817` | Secondary controls, table hover | — |
| `--bg-input` | `#12180e` | Form inputs, selects, signature canvas | — |
| `--border-subtle` | `#29381e` | Dividers, table hairlines | — |
| `--border-strong` | `#3b5228` | Card/input boundaries | — |
| `--text-primary` | `#f2f7ed` | Headings, primary values | 14.3:1 |
| `--text-secondary` | `#c8dab8` | Body copy, table values | 10.6:1 |
| `--text-muted` | `#9eb38c` | Form labels, table headers, captions | 7.3:1 |

### Primary Accent (Agronomic Field Lime)
| Token | Hex | Usage | Text Ink | Contrast |
| :--- | :--- | :--- | :--- | :--- |
| `--accent-lime` | `#84cc16` | Primary CTAs, active nav tab, Wake Lock ON, success toast | `#0f1709` | 9.8:1 (AAA) |
| `--accent-lime-hover` | `#a3e635` | Hover/active state on primary CTA | `#0f1709` | 12.1:1 (AAA) |
| `--accent-lime-soft` | `#243319` | Secondary olive buttons, active highlight surface | `#bef264` | 10.4:1 (AAA) |

### Semantic Status Tokens (Delta T & ePOD)
| State | Surface | Border | Ink |
| :--- | :--- | :--- | :--- |
| **Optimal / Certified** | `#052e16` | `#166534` | `#bbf7d0` |
| **Caution / Fuel / Marginal** | `#451a03` | `#b45309` | `#fde68a` |
| **Danger / Drift Lock / Error** | `#4c0519` | `#be123c` | `#fecdd3` |
| **Low Delta T (< 2°C)** | `#0c292b` | `#155e63` | `#a5f3fc` |
| **Demo Data Marker** | `#2e2611` | `#856404` | `#fde68a` |

---

## 3. Typography & Scale

- **UI Sans:** `'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif` (zero external font network dependency for 100% offline PWA reliability).
- **Telemetry Mono:** `'Consolas', 'Liberation Mono', ui-monospace, monospace` with `font-variant-numeric: tabular-nums` reserved strictly for order IDs, coordinates, SHA-256 seals, hectare metrics, and currency columns.

| Level | Element | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| Display Page Title | `h1` (1 per active view) | `1.75rem` (`28px`) | `800` | `1.2` |
| Section Heading | `h2` | `1.3125rem` (`21px`) | `700` | `1.3` |
| Card / Modal Heading | `h3` | `1.0625rem` (`17px`) | `700` | `1.35` |
| Sub-section Heading | `h4` | `0.9375rem` (`15px`) | `700` | `1.4` |
| Body / Controls | `p`, `td`, `input`, `button` | `0.875rem` (`14px`) | `400–600` | `1.5` |
| Captions / Labels | `label`, `th`, badges | `0.75rem` (`12px`) minimum | `600` | `1.4` |

Functional UI text is never rendered below `12px` (`0.75rem`).

---

## 4. Layout Rhythm, Touch Ergonomics & Component Rules

- **Touch Targets:** Every interactive control (`button`, `a`, `input`, `select`, modal close button) enforces `min-height: 44px` (`min-width: 44px` on icon-only controls) and `touch-action: manipulation`.
- **Single-Level Containment:** Cards never nest bordered cards inside other bordered cards. Internal sections separate with `border-t border-[#29381e]` hairlines and `12px–16px` spacing.
- **No Fake Halos or Side-Tabs:** Zero colored `box-shadow` glows, zero thick `border-l-4` accents, zero endless `animate-pulse` status dots.
- **Iconography:** Unified inline SVG stroke icons (`24x24` grid, `stroke-width="2"`, `aria-hidden="true"`). Zero decorative Unicode emojis in UI controls, tabs, or headings.

---

## 5. Accessibility, Motion & Print

- **Keyboard & ARIA:** Visible `2px solid #bef264` `:focus-visible` ring on all controls; `role="tablist"` / `role="tab"` / `aria-selected` navigation; `role="dialog" aria-modal="true" aria-labelledby="modalTitle"` modals closed via `Escape`, close button (`aria-label`), or backdrop click; explicit `<label for="...">` bindings on every form input/select.
- **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` disables all transitions and transforms.
- **Print (`@media print`):** Hides `.no-print` chrome and switches surfaces to `#ffffff` background with `#111827` dark ink and `#d1d5db` borders for physical acta/settlement printing.
