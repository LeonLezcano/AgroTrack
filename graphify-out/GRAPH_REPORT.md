# Graph Report - c:\Users\Regondi Calidad\Desktop\QM\AgroTrack  (2026-11-17)

## Corpus Check
- Corpus is ~16,639 words - fits in a single context window. You may not need a graph.

## Summary
- 212 nodes · 393 edges · 15 communities (7 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12

## God Nodes (most connected - your core abstractions)
1. `AgroTrackApp` - 40 edges
2. `formatHectares()` - 14 edges
3. `AgroTrackCache` - 13 edges
4. `FieldRegistry` - 12 edges
5. `LaborService` - 11 edges
6. `MachineryCatalog` - 10 edges
7. `CampaignSettlementService` - 9 edges
8. `formatUSD()` - 9 edges
9. `sha256()` - 8 edges
10. `keywords` - 7 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (15 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (48): badScheme, cache, campServ, certUrl, cleanAttr, cleanPhone, cleanScript, completedOrder (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (9): TankMixCalculator, ICONS, CampaignSettlementService, evaluateDeltaTSafety(), formatARS(), formatDate(), formatDateTime(), formatLitersPerHa() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (18): author, description, keywords, license, name, scripts, security:full, test (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (4): DeltaTSentinel, LaborService, rightRotate(), sha256()

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (11): background_color, description, display, icons, lang, name, orientation, scope (+3 more)

## Knowledge Gaps
- **78 isolated node(s):** `name`, `short_name`, `description`, `start_url`, `scope` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AgroTrackApp` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `AgroTrackCache` connect `Community 6` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `formatHectares()` connect `Community 1` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._