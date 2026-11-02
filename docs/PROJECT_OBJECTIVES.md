# Project Objectives & Syllabus Alignment

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/PROJECT_OBJECTIVES.md`  

---

## 1. Overview & Pedagogical Purpose

The primary objective of the **Terminus Railway Reservation System** is to provide an end-to-end, production-grade realization of theoretical database principles taught in **BCSE302L (Database Management Systems)**. 

Rather than relying on abstract classroom exercises or simulated mockups, Terminus implements an industrial-strength architecture where core business rules, entity validations, transaction lifecycles, and concurrency locks are directly evaluated inside **Oracle Database 19c Enterprise Edition**, accessed via **Java 21 Native JDBC**.

---

## 2. Comprehensive Objectives Matrix

The project establishes **12 concrete, measurable objectives**, each mapped to specific curriculum competencies:

| Obj ID | Specific Objective | Measurable Technical Outcome | Syllabus Module / DBMS Concept Demonstrated |
| :---: | :--- | :--- | :--- |
| **OBJ-01** | **Normalized Relational Schema Architecture** | Design and implement an 8-table relational data model normalized to BCNF (with SEAT at 3NF), establishing formal candidate keys, primary keys, and foreign keys. | Relational Data Model, Functional Dependencies, Relational Decomposition (3NF/BCNF). |
| **OBJ-02** | **Multi-Layered Data Integrity Enforcement** | Implement 100% database-level validation using 8 Primary Keys, 10 Foreign Keys with referential integrity actions, 8 Unique Constraints, and 8 Check Constraints. | Declarative Integrity Constraints, Domain Integrity, Referential Constraints (`ON DELETE CASCADE`). |
| **OBJ-03** | **Trigger-Driven Business Validation** | Develop active database triggers (`TRG_VALIDATE_RESERVATION`, `TRG_SYNC_RESERVATION_ON_PAYMENT`) to validate route sequence monotonicity and synchronize payment status. | Active Databases, Event-Condition-Action (ECA) Rules, Compound Row-Level Triggers. |
| **OBJ-04** | **Pessimistic Concurrency & Lock Serialization** | Eliminate the double-booking anomaly under concurrent multi-user load using explicit `SELECT ... FOR UPDATE` row locks with canonical lock ordering. | Concurrency Control, Two-Phase Locking (2PL), Deadlock Prevention, Pessimistic Locking. |
| **OBJ-05** | **Physical Deduplication via Function-Based Indexing** | Deploy a composite function-based unique index (`IDX_ACTIVE_SEAT_RESERVATION`) that permits re-use of seats upon cancellation while preventing multiple active reservations. | Physical Database Design, B-Tree Indexes, Function-Based Indexing, Sparse Uniqueness. |
| **OBJ-06** | **Encapsulated Stored Procedure Business Layer** | Author 4 core PL/SQL stored procedures (`P_BOOK_TICKET`, `P_RECORD_PAYMENT`, `P_CANCEL_RESERVATION`, `P_EXPIRE_STALE_RESERVATIONS`) with `OUT` parameters and zero embedded commits. | PL/SQL Architecture, Procedural Abstraction, Separation of Concerns, Transaction Delegation. |
| **OBJ-07** | **Deterministic Fare & Capacity Computing Functions** | Develop 3 PL/SQL functions (`F_CALCULATE_FARE`, `F_AVAILABLE_SEAT_COUNT`, `F_NET_PAID_AMOUNT`) computing dynamic pricing, real-time availability, and net financial balances. | Stored Functions, Deterministic Math, Aggregation Functions, Computational Relational Models. |
| **OBJ-08** | **Batch Resource Reclamation via Explicit Cursors** | Implement a maintenance routine using parameterized explicit cursors with `FOR UPDATE` and `WHERE CURRENT OF` to sweep and expire abandoned reservation holds. | Cursor Management, Cursor Attributes (`%FOUND`, `%NOTFOUND`), In-Flight Pointer Traversal. |
| **OBJ-09** | **Exhaustive Analytical Query Suite (Q01–Q18)** | Design 18 analytical, operational, and auditing SQL queries demonstrating multi-table inner/outer joins, `GROUP BY`, `HAVING`, window functions, and `LISTAGG`. | Complex SQL, Relational Algebra, OLAP Window Functions (`DENSE_RANK`, `OVER`), Aggregation. |
| **OBJ-10** | **Empirical ACID Property Verification** | Construct test harnesses demonstrating Atomicity (all-or-nothing rollback), Consistency (invariant enforcement), Isolation (read committed), and Durability (redo logging). | Transaction Management, ACID Verification, Redo/Undo Mechanics, System Recovery. |
| **OBJ-11** | **Direct Native JDBC Data Access Layer** | Build an enterprise Spring Boot backend utilizing direct Java JDBC (`PreparedStatement`, `CallableStatement`, `DataSource`) without ORM layers, controlling manual transactions. | Database Application Programming, JDBC API, Parameter Binding, SQL Injection Prevention. |
| **OBJ-12** | **Interactive Database Operations Lab UI** | Build a web-based dashboard allowing real-time query execution, execution plan inspection, query runtime profiling, and live table data inspection. | Database Administration, Query Profiling, Human-Computer Interface for DBMS Observability. |

---

## 3. Detailed Objective Breakdown & Implementation Evidence

### OBJ-01: Normalized Schema Design (BCNF / 3NF)
- **Target:** Eliminate data anomalies (insertion, deletion, update) across train schedules, stops, coaches, and passenger profiles.
- **Evidence:** 8 tables (`PASSENGER`, `STATION`, `TRAIN`, `TRAIN_STOP`, `TRAIN_SCHEDULE`, `SEAT`, `RESERVATION`, `PAYMENT`) with mathematical functional dependency proofs documented in [`docs/NORMALIZATION.md`](NORMALIZATION.md).

### OBJ-02 & OBJ-03: Multi-Layered Constraints & Triggers
- **Target:** Prevent illegal data states from entering the database regardless of client origin.
- **Evidence:**
  - Check constraints ensure `fare_amount >= 0`, `gender IN ('Male', 'Female', 'Other')`, and `source_station_id <> destination_station_id`.
  - `TRG_VALIDATE_RESERVATION` intercepts all reservations and verifies that the boarding station occurs earlier along the route sequence than the deboarding station ($Seq_{src} < Seq_{dest}$).

### OBJ-04 & OBJ-05: Concurrency Control & Double-Booking Prevention
- **Target:** Support high-concurrency seat reservation requests without race conditions or deadlocks.
- **Evidence:**
  - Row-level lock acquisition order:
    1. Lock `TRAIN_SCHEDULE` row (`FOR UPDATE`).
    2. Validate and check `SEAT` availability.
    3. Insert `RESERVATION` and update `PAYMENT`.
  - Index `IDX_ACTIVE_SEAT_RESERVATION` enforces physical uniqueness over `(schedule_id, seat_id)` exclusively for `PENDING` and `CONFIRMED` states, returning `ORA-00001` if concurrent threads bypass application checks.

### OBJ-06 & OBJ-07: PL/SQL Engine (Procedures & Functions)
- **Target:** Encapsulate business logic entirely within database-compiled routines to maximize performance and security.
- **Evidence:**
  - `P_BOOK_TICKET`: 11-step atomic procedure taking passenger, train, route, and payment inputs and yielding structured `OUT` parameters.
  - `F_CALCULATE_FARE`: Multi-tiered formula applying coach class multipliers (SL: 0.50, 3A: 1.20, 2A: 1.80, 1A: 3.00, CC: 1.50) with a base floor of ₹50.00.

### OBJ-08: Explicit Cursors for Batch Sweeps
- **Target:** Prevent database resource exhaustion caused by abandoned booking holds.
- **Evidence:**
  - `P_EXPIRE_STALE_RESERVATIONS` opens a cursor `c_stale` selecting reservations with `booking_status = 'PENDING'` older than $N$ minutes and updates each using `WHERE CURRENT OF c_stale`.

### OBJ-09: Analytical SQL Query Suite
- **Target:** Demonstrate relational algebra capabilities through operational, diagnostic, and executive reports.
- **Evidence:** 18 distinct queries covering station throughput, passenger loyalty classification, refund reconciliation, and double-booking audits, cataloged in [`docs/SQL_QUERY_DOCUMENTATION.md`](SQL_QUERY_DOCUMENTATION.md).

### OBJ-10: ACID Verification Harness
- **Target:** Empirically validate the 4 foundational ACID guarantees under controlled failure injection.
- **Evidence:** Script `database/12_acid_tests.sql` validates atomicity rollbacks on power crash simulation, consistency checks, read-committed isolation, and redo-log durability.

### OBJ-11: High-Performance Native JDBC Layer
- **Target:** Bridge application logic to Oracle without third-party ORM overhead.
- **Evidence:** Repositories in `com.railway.reservation.repository.*` using `Connection.setAutoCommit(false)`, `CallableStatement.registerOutParameter()`, and parameter binding.

### OBJ-12: Database Operations Lab
- **Target:** Provide an administrative interface for live DBMS demonstration and viva examination.
- **Evidence:** REST controller `DatabaseLabController` and UI module exposing pre-registered query execution, dynamic SQL execution, and execution latency instrumentation.
