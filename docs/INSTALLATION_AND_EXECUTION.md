# Installation & Execution Guide

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/INSTALLATION_AND_EXECUTION.md`  

---

## 1. System Prerequisites & Environment Matrix

Before deploying the **Terminus Railway Reservation System**, ensure that the host development machine meets or exceeds the following requirements:

| Component | Minimum Version | Recommended Tool / Distribution | Verification Command |
| :--- | :--- | :--- | :--- |
| **Operating System** | macOS 13+, Ubuntu 22.04 LTS, or Windows 11 | 64-bit architecture with $\ge 8$ GB RAM | `uname -a` or `winver` |
| **Database Engine** | **Oracle Database 19c Enterprise** or **Oracle XE 21c** | Docker Container (`gvenzl/oracle-xe`) or Native Install | `sqlplus -v` |
| **Java Development Kit** | **Java 21 LTS** | Eclipse Temurin 21, OpenJDK 21, or Oracle JDK 21 | `java -version` |
| **Build Tool** | **Maven 3.9+** (Included Maven Wrapper `mvnw`) | Bundled Maven Wrapper (`./mvnw`) | `./mvnw -v` |
| **Node.js & NPM** | **Node.js 18 LTS** or 20 LTS | Node.js Runtime with NPM 9+ | `node -v && npm -v` |
| **SQL Client** | Oracle SQL*Plus or SQLcl | Bundled with Oracle Client or Command Line | `sqlplus` |

---

## 2. Oracle Database Setup & Schema Deployment

### Step 2.1: Provisioning the Database Instance (Docker Option)
If running Oracle Database via Docker, launch the official Express Edition container:
```bash
docker run -d \
  --name terminus-oracle \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=SysPassword123 \
  -e APP_USER=railway_user \
  -e APP_USER_PASSWORD=railway_pass \
  gvenzl/oracle-xe:21-slim
```
*Wait approximately 60 seconds for the database instance to initialize.*

### Step 2.2: User & Tablespace Setup (Native / SYSDBA Option)
If connecting to an existing Oracle 19c Enterprise or XE instance, log in as `SYSDBA` and provision the dedicated schema user:
```sql
-- Connect as SYSDBA to the Pluggable Database (e.g. XEPDB1 or ORCLPDB)
CONNECT sys/SysPassword123@localhost:1521/XEPDB1 AS SYSDBA;

-- Create application schema user
CREATE USER railway_user IDENTIFIED BY railway_pass;

-- Grant required operational privileges
GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE PROCEDURE, CREATE TRIGGER, CREATE SEQUENCE TO railway_user;
ALTER USER railway_user QUOTA UNLIMITED ON USERS;

EXIT;
```

### Step 2.3: Executing the 15-Script Database Creation Suite
Connect to the database as `railway_user` and execute the master deployment script `database/run_all.sql`:

```bash
cd /Users/mohammadammarabdullah/Terminus/database

# Connect using SQL*Plus or SQLcl
sqlplus railway_user/railway_pass@localhost:1521/XEPDB1
```

Once inside the SQL*Plus shell, execute:
```sql
SQL> @run_all.sql
```

#### Strict Script Execution Sequence:
The master harness executes the 15 component scripts in exact dependency order:
```
[1/15]  01_reset_schema.sql        -- Drops existing triggers, procedures, views, tables, and sequences
[2/15]  02_create_tables.sql        -- Creates 8 core tables with PK, FK, unique, and check constraints
[3/15]  03_create_sequences.sql     -- Initializes surrogate primary key and code sequences
[4/15]  04_create_indexes.sql       -- Builds performance B-tree indexes & IDX_ACTIVE_SEAT_RESERVATION
[5/15]  05_create_functions.sql     -- Deploys F_CALCULATE_FARE, F_AVAILABLE_SEAT_COUNT, F_NET_PAID_AMOUNT
[6/15]  06_create_procedures.sql    -- Deploys P_BOOK_TICKET, P_RECORD_PAYMENT, P_CANCEL, P_EXPIRE
[7/15]  07_create_triggers.sql      -- Deploys TRG_VALIDATE_RESERVATION & TRG_SYNC_RESERVATION_ON_PAYMENT
[8/15]  08_create_views.sql         -- Generates reporting views
[9/15]  09_insert_seed_data.sql     -- Populates master catalog (10 stations, 4 trains, 100+ seats, schedules)
[10/15] 10_sql_queries.sql          -- Executes analytical queries Q01 through Q18
[11/15] 11_transaction_demos.sql   -- Runs Transactions A through E demonstrations
[12/15] 12_acid_tests.sql          -- Executes empirical ACID verification suite
[13/15] 13_concurrency_tests.sql   -- Runs multi-session concurrency & double-booking stress tests
[14/15] 14_constraint_tests.sql    -- Validates all table constraints and error codes
[15/15] 15_data_validation.sql     -- Asserts final relational integrity metrics
```

---

## 3. Backend Configuration & Startup (Spring Boot)

### Step 3.1: Environment Variables Configuration
Copy the template configuration in the project root:
```bash
cd /Users/mohammadammarabdullah/Terminus
cp .env.example .env
```

Verify or adjust `.env` parameters to match your Oracle instance:
```env
# Oracle Database Connection
ORACLE_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1
ORACLE_USER=railway_user
ORACLE_PASSWORD=railway_pass

# Spring Boot Server Port
SERVER_PORT=8080

# CORS Allowed Origin for React Frontend
CORS_ALLOWED_ORIGIN=http://localhost:5173
```

### Step 3.2: Compiling and Running the Backend
Navigate to the `backend/` directory and start the application using the Maven Wrapper:
```bash
cd /Users/mohammadammarabdullah/Terminus/backend

# Clean compile and package
./mvnw clean package -DskipTests

# Run the Spring Boot application
./mvnw spring-boot:run
```

*Expected Terminal Log Output:*
```
2026-11-02 00:01:00.123 [main] INFO  c.r.r.RailwayReservationApplication - Starting RailwayReservationApplication v1.0.0...
2026-11-02 00:01:02.456 [main] INFO  com.zaxxer.hikari.HikariDataSource - RailwayHikariCP - Starting...
2026-11-02 00:01:03.112 [main] INFO  com.zaxxer.hikari.pool.HikariPool - RailwayHikariCP - Added connection oracle.jdbc.driver.T4CConnection@...
2026-11-02 00:01:03.115 [main] INFO  com.zaxxer.hikari.HikariDataSource - RailwayHikariCP - Start completed.
2026-11-02 00:01:04.890 [main] INFO  o.s.b.w.e.tomcat.TomcatWebServer - Tomcat started on port 8080 (http) with context path ''
2026-11-02 00:01:04.912 [main] INFO  c.r.r.RailwayReservationApplication - Started RailwayReservationApplication in 4.9 seconds
```

---

## 4. Frontend Client Setup & Startup (React / Vite)

### Step 4.1: Installation & Dependency Resolution
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd /Users/mohammadammarabdullah/Terminus/frontend
npm install
```

### Step 4.2: Starting the Vite Development Server
Start the frontend server:
```bash
npm run dev
```

*Expected Terminal Log Output:*
```
  VITE v5.2.0  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open your browser and navigate to:  
👉 **`http://localhost:5173/`**

---

## 5. Troubleshooting Common Installation & Runtime Issues

| Symptom / Error Message | Root Cause | Resolution Steps |
| :--- | :--- | :--- |
| **`ORA-12541: TNS:no listener`** | The Oracle Database listener process is not running or port 1521 is blocked. | Verify Oracle container/service is running: `docker ps` or `lsnrctl status`. Confirm port 1521 is listening. |
| **`ORA-01017: invalid username/password`** | Mismatched credentials between `.env` and Oracle database schema user. | Confirm credentials in SQL*Plus: `sqlplus railway_user/railway_pass@localhost:1521/XEPDB1`. Update `.env` accordingly. |
| **`ORA-00001: unique constraint violated`** | Attempting to insert a duplicate key during seed insertion. | Execute `database/01_reset_schema.sql` to purge dirty prior state, then re-run `@run_all.sql`. |
| **`Connection to localhost:8080 refused`** | Spring Boot backend is not running or crashed during initialization. | Inspect `backend/` console logs for database connectivity failures or port collisions on 8080. |
| **`CORS Policy: No Access-Control-Allow-Origin`** | Frontend origin does not match `cors.allowed-origin`. | Verify `application.properties` or `.env` has `CORS_ALLOWED_ORIGIN=http://localhost:5173`. |
| **`ORA-01000: maximum open cursors exceeded`** | Statement or ResultSet leak in unclosed JDBC objects. | Terminus uses try-with-resources across all repositories. If executing custom SQL in lab, ensure statements are closed. |
