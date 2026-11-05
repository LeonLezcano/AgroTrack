# Graph Report - .  (2026-11-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 180 nodes · 329 edges · 10 communities (4 shown, 6 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `AgroTrackApp` - 28 edges
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

## Communities (10 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (48): badScheme, cache, campServ, certUrl, cleanAttr, cleanPhone, cleanScript, completedOrder (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (4): AgroTrackApp, formatHectares(), formatUSD(), Sanitizer

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (9): DeltaTSentinel, LaborService, rightRotate(), sha256(), evaluateDeltaTSafety(), formatARS(), formatDate(), formatDateTime() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (18): author, description, keywords, license, name, scripts, security:full, test (+10 more)

## Knowledge Gaps
- **64 isolated node(s):** `name`, `version`, `description`, `type`, `test` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AgroTrackApp` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `AgroTrackCache` connect `Community 4` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `FieldRegistry` connect `Community 5` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._