# Architectural and Database Diagrams

This directory holds visual diagrams, system schematics, vector SVG exports, and entity-relationship models for the **Terminus Railway Reservation System** (Course: **BCSE302L Database Management Systems**).

## Included Artifacts & Visual Diagrams

| Diagram Artifact | Vector Graphic (SVG) | Mermaid Source (`.mmd`) | Description | Primary Document Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Complete Relational ER Model** | [`er_diagram.svg`](./er_diagram.svg) | [`er_diagram.mmd`](./er_diagram.mmd) | Exhaustive 8-table Entity-Relationship Model depicting PKs, FKs, unique keys, check constraints, and all 10 structural relationships | [`docs/ER_DIAGRAM.md`](../ER_DIAGRAM.md) |
| **Three-Tier Deployment Architecture** | [`system_architecture.svg`](./system_architecture.svg) | [`system_architecture.mmd`](./system_architecture.mmd) | End-to-end system topology showing React 18 SPA (Tier 1), Spring Boot 3 Native JDBC Core (Tier 2), and Oracle 19c Enterprise (Tier 3) | [`docs/SYSTEM_ARCHITECTURE.md`](../SYSTEM_ARCHITECTURE.md) |
| **Transaction A Workflow (Booking)** | Renderable via `.mmd` / Markdown | [`transaction_workflow.mmd`](./transaction_workflow.mmd) | Two-phase sequence diagram showing row locking (`FOR UPDATE`), atomic booking, trigger synchronization, and redo log commit | [`docs/TRANSACTION_MANAGEMENT.md`](../TRANSACTION_MANAGEMENT.md) |
| **Concurrency Control & Deduplication** | Renderable via `.mmd` / Markdown | [`concurrency_control.mmd`](./concurrency_control.mmd) | Concurrency race condition defense demonstrating canonical lock ordering and function-based unique indexing (`IDX_ACTIVE_SEAT_RESERVATION`) | [`docs/CONCURRENCY_CONTROL.md`](../CONCURRENCY_CONTROL.md) |

---

### Export and Usage Instructions

1. **Viewing in Browser:**
   - Both `er_diagram.svg` and `system_architecture.svg` are standalone, standard SVG vectors that can be opened in any web browser, inserted into LaTeX/Word project reports, or printed for review presentations.

2. **Rendering Mermaid Sources:**
   - All `.mmd` source files can be rendered interactively in GitHub, VS Code, or Antigravity IDE.
   - To recompile Mermaid into raster images (PNG) or SVG via CLI:
     ```bash
     npx -y @mermaid-js/mermaid-cli -i er_diagram.mmd -o er_diagram.png
     npx -y @mermaid-js/mermaid-cli -i system_architecture.mmd -o system_architecture.png
     ```
