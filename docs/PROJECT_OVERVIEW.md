# Railway Reservation System (Terminus)
## Academic Project Overview & System Specification

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Academic Semester / Year:** Fall / Winter Academic Term  
**Target Environment:** Oracle Database 19c Enterprise / Spring Boot 3 (Native JDBC) / React 18  

---

## 1. Executive Summary

The **Railway Reservation System (Terminus)** is an enterprise-grade, three-tier computerized passenger reservation and inventory management application designed to model the mission-critical core of national railway networks like Indian Railways (IRCTC). Developed as a capstone project for **BCSE302L Database Management Systems**, Terminus demonstrates advanced relational database architecture, rigorous transaction management, strict ACID property enforcement, pessimistic concurrency control, and deep database-layer business logic orchestration.

Rather than treating the database as an inert bit-store, Terminus leverages **Oracle Database 19c** as an active computing engine. The core operational workflows—including ticket booking, race-condition-free seat allocation, dynamic class- and distance-based fare calculation, payment processing, refund reconciliation, and stale hold expiration—are implemented natively using **Oracle PL/SQL Stored Procedures, Deterministic Functions, Compound Database Triggers, and Analytic SQL Queries**.

The backend service, constructed with **Java 21 and Spring Boot 3**, eschews heavy Object-Relational Mapping (ORM) frameworks like Hibernate in favor of direct, deterministic **Java Database Connectivity (JDBC)**. By utilizing `PreparedStatement`, `CallableStatement`, and explicit connection-level transaction boundaries (`setAutoCommit(false)`, `commit()`, `rollback()`), the system ensures absolute transparency in SQL execution, eliminating the N+1 query problem, unwanted hidden caching, and unpredictable lock escalation.

---

## 2. Technology Stack Overview

The architectural stack is cleanly partitioned into three decoupled tiers:

```mermaid
flowchart TD
    subgraph Client Tier ["Client Tier (Presentation)"]
        UI["React 18 Single Page Application\n(TypeScript / Tailwind CSS / Lucide Icons)"]
        Lab["Database Operations Lab UI\n(SQL Playground / Performance Profiler)"]
    end

    subgraph App Tier ["Application Tier (Spring Boot / Java 21)"]
        API["Spring Boot 3 REST Controllers"]
        SVC["Service Orchestration Layer"]
        JDBC["Native JDBC Repositories\n(PreparedStatement & CallableStatement)"]
        Pool["HikariCP Connection Pool (Max: 10, Min: 2)"]
    end

    subgraph DB Tier ["Database Tier (Oracle 19c Enterprise)"]
        Tables["8 Core Relational Tables\n(PK, FK, Unique, Check Constraints)"]
        FBI["Function-Based Unique Indexes\n(IDX_ACTIVE_SEAT_RESERVATION)"]
        PLSQL["PL/SQL Business Engine\n(4 Procedures, 3 Functions, 2 Triggers)"]
        Views["Analytical Reporting Views & Cursors"]
    end

    UI -->|JSON / REST over HTTP| API
    Lab -->|JSON / REST over HTTP| API
    API --> SVC
    SVC --> JDBC
    JDBC --> Pool
    Pool -->|Oracle Thin Driver (OJDBC11)| DB Tier
    PLSQL --> Tables
    FBI --> Tables
```

### Detailed Component Specifications

| Architecture Tier | Technology / Framework | Role & Scope | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Database Tier** | **Oracle Database 19c** (Enterprise / XE) | Primary Relational Datastore & Business Logic Engine | 8 normalized tables, sequences, function-based indexes, PL/SQL packages, row-level locking (`FOR UPDATE`), read committed transaction isolation. |
| **Application Tier** | **Java 21 LTS / Spring Boot 3.2+** | Backend Business API & Direct JDBC Data Access | Handcrafted JDBC mapping, explicit transaction demarcation, dual statement invocation (`PreparedStatement` / `CallableStatement`), HikariCP pooling. |
| **Driver & Networking** | **Oracle JDBC Driver (OJDBC11)** | Low-overhead network protocol bridge | Thin protocol connection over port 1521, Oracle SQL error code mapping (`ORA-00001`, `ORA-02290`, `ORA-20001` to `ORA-20030`). |
| **Presentation Tier** | **React 18 / Vite / TypeScript** | Responsive User Interface & Admin Control Center | Train search, interactive seat layout selector, PNR booking status tracking, administrative schedule manager, and **Database Operations Lab**. |
| **Quality & Audit** | **Oracle SQL*Plus / SQLcl / JUnit 5** | Test Automation & ACID Verification Suite | 15+ declarative test scripts covering ACID verification, concurrency stress testing, constraint violation harness, and query benchmarks. |

---

## 3. Core Problem & System Description

Modern railway networks transport millions of passengers daily across intricate, overlapping routes. Managing such systems via manual or weakly integrated mechanisms introduces critical vulnerabilities:
1. **The Double-Booking Anomaly:** Simultaneous attempts by multiple terminal clerks or web passengers to reserve the same berth on a popular holiday train cause conflicting allocations unless pessimistic synchronization or physical uniqueness is enforced.
2. **Intermediate Overlap Conflicts:** Trains service dozens of intermediate halts. A reservation from Station A to Station C must ensure that the seat is booked only between those stations and that route traversal direction (upstream vs. downstream) is validated at the database level.
3. **Incomplete Transaction State:** A user booking whose simulated payment fails midway must never leave lingering hold locks, orphan records, or dangling pending seat claims.
4. **Financial Reconciliation Gaps:** When passenger cancellations occur, fare refund algorithms must reconcile prior successful captures against outgoing refunds with zero financial discrepancy.

**Terminus** addresses these challenges by implementing:
- **Strict 8-Table Schema:** A normalized, mathematically rigorous data model representing `PASSENGER`, `STATION`, `TRAIN`, `TRAIN_STOP`, `TRAIN_SCHEDULE`, `SEAT`, `RESERVATION`, and `PAYMENT`.
- **Function-Based Deduplication Index:** A specialized unique index `IDX_ACTIVE_SEAT_RESERVATION` that evaluates exclusively over `PENDING` and `CONFIRMED` bookings, allowing instant seat recycling upon cancellation without manual table scrubbing.
- **Transactional Stored Procedures:** Fully encapsulated database routines (`P_BOOK_TICKET`, `P_RECORD_PAYMENT`, `P_CANCEL_RESERVATION`, `P_EXPIRE_STALE_RESERVATIONS`) executing with caller-controlled transaction scopes.
- **Real-Time Data Dictionary & Auditing:** Comprehensive database views and automated triggers (`TRG_VALIDATE_RESERVATION`, `TRG_SYNC_RESERVATION_ON_PAYMENT`) enforcing domain invariants before row insertion.

---

## 4. Key Academic Project Objectives Summary

This project has been developed to demonstrate Mastery of core concepts in **BCSE302L**:

1. **Entity-Relationship & Relational Modeling:** Constructing an 8-table normalized relational schema adhering to Boyce-Codd Normal Form (BCNF) / 3NF with documented functional dependency trade-offs.
2. **Relational Integrity Enforcement:** Defining declarative primary keys, foreign keys with referential actions (`ON DELETE CASCADE`), composite unique keys, domain check constraints, and custom trigger-driven invariant validations.
3. **Complex SQL Querying:** Authoring an 18-query analytical suite demonstrating multi-table inner/outer joins, hierarchical aggregation (`GROUP BY`, `HAVING`), window analytic functions (`ROW_NUMBER()`, `DENSE_RANK()`, `OVER()`), correlated subqueries, and `LISTAGG` string manipulation.
4. **PL/SQL Programming:** Developing stored procedures with `OUT` parameters, user-defined functions with deterministic math, explicit cursors with `FOR UPDATE` and `WHERE CURRENT OF`, and compound row-level triggers.
5. **Transaction Management & ACID Guarantees:** Demonstrating strict Atomicity, Consistency, Isolation, and Durability through systematic failure injection, `SAVEPOINT` rollbacks, and committed state verifications.
6. **Concurrency Control & Deadlock Prevention:** Establishing strict lock hierarchies (`TRAIN_SCHEDULE` $\rightarrow$ `SEAT` $\rightarrow$ `RESERVATION`) to serialize competing bookings and eliminate cyclic deadlocks (`ORA-00060`).
7. **Direct JDBC Integration:** Utilizing low-level Java JDBC drivers to execute queries and stored procedures, managing physical connection states directly without ORM abstraction.
8. **Operational Observability:** Providing a web-based **Database Operations Lab** enabling faculty and students to execute, benchmark, and inspect all 18 SQL queries and PL/SQL procedures in real time.

---

## 5. Documentation Roadmap

The complete technical and academic documentation for Terminus is organized into 22 dedicated markdown deliverables within the `docs/` repository:

```
docs/
├── PROJECT_OVERVIEW.md              (You are here: Executive summary and tech stack)
├── PROBLEM_DEFINITION.md            (Problem statement, challenges, and user personas)
├── PROJECT_OBJECTIVES.md            (Measurable goals mapped to DBMS syllabus modules)
├── PROJECT_SCOPE.md                 (Functional boundaries, in-scope/out-of-scope matrix)
├── FUNCTIONAL_REQUIREMENTS.md       (Numbered requirements FR-01 through FR-14+)
├── NON_FUNCTIONAL_REQUIREMENTS.md   (Performance, ACID, security, and usability benchmarks)
├── SYSTEM_ARCHITECTURE.md           (Three-tier architecture, sequence, and flow diagrams)
├── DATABASE_DESIGN.md               (Schema rationale, design decisions, and trade-offs)
├── ER_DIAGRAM.md                    (Mermaid ER diagram covering all 8 tables and 10 relationships)
├── RELATIONAL_SCHEMA.md             (Formal relational notation, underlined PKs, FK vectors)
├── DATA_DICTIONARY.md               (Column-level metadata, sizes, nullability, and constraints)
├── NORMALIZATION.md                 (FD analysis, candidate keys, 1NF-BCNF proofs, SEAT trade-off)
├── SQL_QUERY_DOCUMENTATION.md       (Exhaustive Q01-Q18 queries, explain plans, and outputs)
├── PL_SQL_DOCUMENTATION.md          (Procedures, functions, triggers, and cursor mechanics)
├── JDBC_IMPLEMENTATION.md           (PreparedStatement, CallableStatement, and tx code patterns)
├── TRANSACTION_MANAGEMENT.md        (Workflows A through E, savepoints, commit/rollback paths)
├── CONCURRENCY_CONTROL.md           (Isolation levels, SELECT FOR UPDATE, lock ordering)
├── ACID_VERIFICATION.md             (Empirical proof scripts and test scenarios for A, C, I, D)
├── TEST_CASES.md                    (30+ structured test cases spanning DB, backend, and UI)
├── REVIEW_III_DEMONSTRATION.md      (Scripted, step-by-step viva / professor evaluation guide)
├── INSTALLATION_AND_EXECUTION.md    (Step-by-step setup for Oracle 19c, Java 21, and React)
├── USER_GUIDE.md                    (End-user and administrator manual with UI walkthroughs)
└── diagrams/
    └── README.md                    (Directory index for vector diagrams and visual artifacts)
```
