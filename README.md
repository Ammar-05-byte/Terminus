# 🚂 Railway Reservation System — Terminus

> **BCSE302L Database Management Systems Course Project**
>
> A complete, functional, database-driven railway reservation web application demonstrating Oracle SQL/PL/SQL, Java JDBC, and React — designed for academic demonstration and faculty review.

---

## 📋 Project Overview

**Terminus** is a Railway Reservation System that allows passengers to search trains, check seat availability, book reservations, generate PNRs, simulate payments, cancel tickets, and view payment history. Administrators can maintain railway records and generate operational reports.

The system demonstrates the complete data flow:

```
User Operation → React Frontend → REST API → Spring Boot (Java JDBC) → Oracle PL/SQL → Database → Result Returned to Website
```

> ⚠️ **Academic Disclaimer**: All train schedules, passenger records, and payment transactions are simulated demonstration data. Payment processing is explicitly simulated — no real financial transactions occur.

---

## ✨ Features

### Passenger Features
- 🔍 Search trains between stations by date
- 🚆 View train routes and intermediate stations
- 💺 Check real-time seat availability by coach class
- 🎫 Book reservations with PNR generation
- 💳 Simulated payment processing (SUCCESS/FAILED)
- 📋 PNR status lookup with complete booking details
- ❌ Cancel reservations with automatic refund recording
- 📊 View complete payment history

### Administrator Features
- 📝 Full CRUD for passengers, stations, trains, routes, schedules, and seats
- 📈 Revenue, occupancy, and booking trend reports
- 🔧 Database maintenance (expire stale reservations)
- 🧪 **Database Operations Lab** — execute and demonstrate PL/SQL components live

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  Vite + TypeScript + Tailwind CSS + React Router         │
│  Port: 5173                                              │
├─────────────────────────────────────────────────────────┤
│                   REST API (JSON)                        │
├─────────────────────────────────────────────────────────┤
│                 BACKEND (Spring Boot)                    │
│  Java 21 + Spring JDBC + Oracle JDBC Driver              │
│  Port: 8080                                              │
│  PreparedStatement | CallableStatement | Transactions    │
├─────────────────────────────────────────────────────────┤
│                DATABASE (Oracle 19c+)                    │
│  8 Tables | 9 Sequences | Functions | Procedures         │
│  Triggers | Views | Indexes                              │
│  Port: 1521                                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema — 8 Tables

| # | Table | Purpose | Records |
|---|-------|---------|---------|
| 1 | `PASSENGER` | Railway passenger information | 15 |
| 2 | `STATION` | Indian railway stations | 12 |
| 3 | `TRAIN` | Train identity and type | 10 |
| 4 | `TRAIN_STOP` | Ordered route stops (resolves TRAIN↔STATION M:N) | 41 |
| 5 | `TRAIN_SCHEDULE` | Dated journey instances | 16 |
| 6 | `SEAT` | Physical seat inventory per train | 60 |
| 7 | `RESERVATION` | Passenger booking records with PNR | 15 |
| 8 | `PAYMENT` | Payment attempts, successes, and refunds | 18 |

### Key PL/SQL Components

| Type | Name | Purpose |
|------|------|---------|
| Procedure | `P_BOOK_TICKET` | Atomic ticket booking with PNR generation |
| Procedure | `P_RECORD_PAYMENT` | Record payment attempt or refund |
| Procedure | `P_CANCEL_RESERVATION` | Cancel booking with refund |
| Procedure | `P_EXPIRE_STALE_RESERVATIONS` | Cursor-based batch expiry |
| Function | `F_CALCULATE_FARE` | Distance × class-based fare calculation |
| Function | `F_AVAILABLE_SEAT_COUNT` | Real-time available seat count |
| Function | `F_NET_PAID_AMOUNT` | Net paid amount (payments - refunds) |
| Trigger | `TRG_VALIDATE_RESERVATION` | Cross-table booking integrity |
| Trigger | `TRG_SYNC_RESERVATION_ON_PAYMENT` | Auto-confirm on successful payment |

---

## 📂 Project Structure

```
Terminus/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── common/          # Badge, Button, Card, DataTable, Modal, Toast, etc.
│   │   │   ├── layout/          # Navbar, Footer, PageLayout, AdminLayout
│   │   │   └── search/          # SearchForm, TrainCard
│   │   ├── pages/               # 9 main pages + 11 admin pages
│   │   │   └── admin/           # Dashboard, CRUD, Reports, DatabaseLab
│   │   ├── services/            # Axios API client
│   │   ├── types/               # TypeScript interfaces
│   │   ├── hooks/               # Custom React hooks
│   │   └── context/             # Toast notification context
│   └── package.json
│
├── backend/                     # Spring Boot + JDBC
│   ├── src/main/java/com/railway/reservation/
│   │   ├── config/              # DataSource, CORS configuration
│   │   ├── controller/          # 10 REST controllers
│   │   ├── service/             # 9 business service classes
│   │   ├── repository/          # 9 JDBC repository classes
│   │   ├── dto/                 # Request/Response DTOs
│   │   ├── model/               # Domain model classes
│   │   └── exception/           # Custom exceptions, GlobalExceptionHandler
│   └── pom.xml
│
├── database/                    # Oracle SQL/PL/SQL scripts
│   ├── 01_reset_schema.sql      # Safe teardown
│   ├── 02_create_tables.sql     # 8 tables with constraints
│   ├── 03_create_sequences.sql  # 9 sequences
│   ├── 04_create_indexes.sql    # Performance + function-based unique index
│   ├── 05_create_functions.sql  # 3 PL/SQL functions
│   ├── 06_create_procedures.sql # 4 PL/SQL procedures
│   ├── 07_create_triggers.sql   # 2 triggers
│   ├── 08_create_views.sql      # 4 reporting views
│   ├── 09_insert_seed_data.sql  # Sample data (10+ per table)
│   ├── 10_sql_queries.sql       # 18 analytical queries (Q01-Q18)
│   ├── 11_transaction_demos.sql # Transaction workflows A-E
│   ├── 12_acid_tests.sql        # ACID property verification
│   ├── 13_concurrency_tests.sql # Double-booking prevention
│   ├── 14_constraint_tests.sql  # Constraint validation (40+ tests)
│   ├── 15_data_validation.sql   # Row count + integrity audit
│   └── run_all.sql              # Master execution script
│
├── docs/                        # 23 documentation files
│   ├── PROJECT_OVERVIEW.md
│   ├── DATABASE_DESIGN.md
│   ├── ER_DIAGRAM.md
│   ├── NORMALIZATION.md
│   ├── SQL_QUERY_DOCUMENTATION.md
│   ├── PL_SQL_DOCUMENTATION.md
│   ├── JDBC_IMPLEMENTATION.md
│   ├── TRANSACTION_MANAGEMENT.md
│   ├── REVIEW_III_DEMONSTRATION.md
│   └── ... (22 more)
│
├── .env.example                 # Environment variable template
├── .gitignore
└── README.md                    # This file
```

---

## 🚀 Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Java JDK | 21 LTS | Backend runtime |
| Maven | 3.9+ | Backend build tool |
| Node.js | 18+ | Frontend runtime |
| npm | 9+ | Frontend package manager |
| Oracle Database | 19c+ (XE/EE) | Database server |
| SQL*Plus or SQL Developer | Latest | SQL script execution |

---

## ⚙️ Setup & Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Terminus
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Oracle connection details:
```properties
ORACLE_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1
ORACLE_USER=railway_user
ORACLE_PASSWORD=railway_pass
```

### 3. Set Up Oracle Database

Create the database user (connect as SYSDBA):
```sql
CREATE USER railway_user IDENTIFIED BY railway_pass;
GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE SEQUENCE, CREATE PROCEDURE, CREATE TRIGGER TO railway_user;
ALTER USER railway_user QUOTA UNLIMITED ON USERS;
```

Execute database scripts in order:
```bash
cd database
sqlplus railway_user/railway_pass@//localhost:1521/XEPDB1 @run_all.sql
```

Or execute individually in SQL Developer:
```
01_reset_schema.sql → 02_create_tables.sql → ... → 09_insert_seed_data.sql
```

### 4. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend starts at `http://localhost:8080`.

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`.

### 6. Access the Application

Open `http://localhost:5173` in your browser.

---

## 🎮 Default Demonstration Workflow

1. **Home Page** → Search for trains from "New Delhi" to "Mumbai Central"
2. **Search Results** → View matching trains with availability
3. **Train Details** → See route with intermediate stations
4. **Seat Availability** → Browse available seats by coach class
5. **Book Ticket** → Complete 5-step booking wizard
6. **PNR Status** → Look up the generated PNR
7. **Payment History** → View all payment attempts
8. **Cancel Ticket** → Cancel and see refund record
9. **Admin Dashboard** → View system statistics
10. **Database Lab** → Execute procedures, functions, and triggers live

---

## 🧪 Testing

### Database Tests
```bash
sqlplus railway_user/railway_pass@//localhost:1521/XEPDB1 @database/14_constraint_tests.sql
sqlplus railway_user/railway_pass@//localhost:1521/XEPDB1 @database/15_data_validation.sql
```

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Build Verification
```bash
cd frontend
npm run build
```

---

## 📊 SQL Queries (Q01-Q18)

| ID | Query | Concepts |
|----|-------|----------|
| Q01 | Search trains by route and date | Multi-table JOIN, subquery |
| Q02 | Complete train route | JOIN, ORDER BY |
| Q03 | Seat availability | LEFT JOIN, NOT EXISTS |
| Q04 | Reservation by PNR | Multi-table JOIN (6 tables) |
| Q05 | Payment history by PNR | JOIN, ORDER BY |
| Q06 | Upcoming trains from station | JOIN, date filtering |
| Q07 | Passenger booking history | JOIN, ORDER BY |
| Q08 | Train-wise occupancy | COUNT, GROUP BY |
| Q09 | Train-wise revenue | SUM, GROUP BY, HAVING |
| Q10 | Popular routes | GROUP BY, COUNT, ORDER BY |
| Q11 | Frequent passengers | Subquery, HAVING, AVG |
| Q12 | Trains without reservations | NOT EXISTS |
| Q13 | Failed payment analysis | JOIN, WHERE filtering |
| Q14 | Monthly booking statistics | EXTRACT, GROUP BY |
| Q15 | Coach-class availability | GROUP BY, COUNT |
| Q16 | Cancellation statistics | COUNT, percentage calc |
| Q17 | Daily schedule report | JOIN, aggregation |
| Q18 | Passenger spending report | SUM, subquery |

---

## 🔒 Security Notes

- All SQL queries use parameterized binding (no string concatenation)
- Database credentials stored in environment variables
- Frontend never connects directly to Oracle
- Payment processing is explicitly simulated
- Stack traces are not exposed to end users
- Admin access uses configurable demo credentials

---

## 📖 Documentation

See the [`docs/`](docs/) directory for comprehensive project documentation including:
- ER Diagram and Relational Schema
- Data Dictionary and Normalization Analysis
- SQL Query Documentation (18 queries)
- PL/SQL Documentation (procedures, functions, triggers, cursors)
- JDBC Implementation Guide
- Transaction Management and Concurrency Control
- ACID Verification
- Test Cases (36 cases)
- Review III Demonstration Script
- Installation and User Guide

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite 5 · TypeScript · Tailwind CSS 4 · React Router 6 · Recharts · Lucide |
| Backend | Java 21 · Spring Boot 3.2 · Spring JDBC · Maven · Oracle JDBC (ojdbc11) |
| Database | Oracle 19c+ · SQL · PL/SQL · Sequences · Views · Triggers · Function-based Indexes |
| API | RESTful JSON over HTTP |

---

## 📄 License

This project is an academic submission for BCSE302L Database Management Systems. It is intended for educational purposes only.

---

*Built with ❤️ for BCSE302L Database Management Systems*

