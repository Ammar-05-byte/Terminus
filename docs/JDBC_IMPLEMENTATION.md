# Enterprise Java JDBC Implementation Guide

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/JDBC_IMPLEMENTATION.md`  

---

## 1. Native JDBC Architecture & Design Strategy

The **Terminus Railway Reservation System** connects its Spring Boot 3 backend to **Oracle Database 19c** using native **Java Database Connectivity (JDBC)**. 

### Why Native JDBC Instead of ORM (Hibernate/JPA)?
In a mission-critical database systems course (**BCSE302L**), relying on heavy ORM frameworks creates undesirable architectural opacity:
1. **Hidden Lazy Loading & N+1 Queries:** ORMs automatically generate queries behind the scenes, obscuring physical relational performance.
2. **Obscured Locking Semantics:** Implementing pessimistic database-level locks (`SELECT ... FOR UPDATE`) through ORM query annotations is fragile and prone to silent degradation.
3. **Impedance Mismatch with Stored Procedures:** Invoking PL/SQL procedures with composite `OUT` parameters and functions inside SQL expressions is cumbersome in JPA, whereas JDBC `CallableStatement` handles them with native wire efficiency.

The system uses `javax.sql.DataSource`, `java.sql.PreparedStatement`, `java.sql.CallableStatement`, and explicit `java.sql.Connection` transaction boundaries.

---

## 2. Five Comprehensive JDBC Code Implementations

---

### Example 1: `PreparedStatement` for Multi-Table Join SELECT Query (Train Search)
- **Component:** `com.railway.reservation.repository.TrainRepository`
- **Method:** `searchTrains(Long sourceStationId, Long destStationId, LocalDate journeyDate)`
- **Concept:** Demonstrates parameter binding (`?`), multi-table relational joins (6 tables), correlated subqueries for real-time seat availability, and `RowMapper` result set transformation.

```java
public List<TrainSearchResponse> searchTrains(Long sourceStationId, Long destStationId, LocalDate journeyDate) {
    String sql = """
        SELECT
            t.TRAIN_ID,
            t.TRAIN_NUMBER,
            t.TRAIN_NAME,
            t.TRAIN_TYPE,
            ts.SCHEDULE_ID,
            ts.JOURNEY_DATE,
            ts.SCHEDULED_DEPARTURE,
            ts.SCHEDULED_ARRIVAL,
            s1.STATION_ID AS SRC_ID,
            s1.STATION_CODE AS SRC_CODE,
            s1.STATION_NAME AS SRC_NAME,
            stop1.DEPARTURE_TIME AS SRC_DEP_TIME,
            s2.STATION_ID AS DST_ID,
            s2.STATION_CODE AS DST_CODE,
            s2.STATION_NAME AS DST_NAME,
            stop2.ARRIVAL_TIME AS DST_ARR_TIME,
            (SELECT COUNT(*) FROM SEAT st
             WHERE st.TRAIN_ID = t.TRAIN_ID
               AND st.SEAT_ID NOT IN (
                   SELECT r.SEAT_ID FROM RESERVATION r
                   WHERE r.SCHEDULE_ID = ts.SCHEDULE_ID
                     AND r.BOOKING_STATUS IN ('CONFIRMED', 'PENDING')
               )) AS AVAILABLE_SEATS
        FROM TRAIN_SCHEDULE ts
        JOIN TRAIN t ON ts.TRAIN_ID = t.TRAIN_ID
        JOIN TRAIN_STOP stop1 ON stop1.TRAIN_ID = t.TRAIN_ID AND stop1.STATION_ID = ?
        JOIN STATION s1 ON s1.STATION_ID = stop1.STATION_ID
        JOIN TRAIN_STOP stop2 ON stop2.TRAIN_ID = t.TRAIN_ID AND stop2.STATION_ID = ?
        JOIN STATION s2 ON s2.STATION_ID = stop2.STATION_ID
        WHERE stop1.STOP_SEQUENCE < stop2.STOP_SEQUENCE
          AND ts.JOURNEY_DATE = ?
          AND t.ACTIVE_STATUS = 'ACTIVE'
          AND ts.SCHEDULE_STATUS != 'CANCELLED'
        ORDER BY ts.SCHEDULED_DEPARTURE ASC
        """;

    log.debug("Executing searchTrains query: src={}, dst={}, date={}", sourceStationId, destStationId, journeyDate);

    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {

        // Positional parameter binding eliminates SQL injection
        ps.setLong(1, sourceStationId);
        ps.setLong(2, destStationId);
        ps.setDate(3, java.sql.Date.valueOf(journeyDate));

        try (ResultSet rs = ps.executeQuery()) {
            List<TrainSearchResponse> results = new ArrayList<>();
            while (rs.next()) {
                results.add(TrainSearchResponse.builder()
                    .trainId(rs.getLong("TRAIN_ID"))
                    .trainNumber(rs.getString("TRAIN_NUMBER"))
                    .trainName(rs.getString("TRAIN_NAME"))
                    .trainType(rs.getString("TRAIN_TYPE"))
                    .scheduleId(rs.getLong("SCHEDULE_ID"))
                    .journeyDate(rs.getDate("JOURNEY_DATE").toLocalDate())
                    .scheduledDeparture(rs.getTimestamp("SCHEDULED_DEPARTURE").toLocalDateTime())
                    .scheduledArrival(rs.getTimestamp("SCHEDULED_ARRIVAL").toLocalDateTime())
                    .sourceDepartureTime(rs.getString("SRC_DEP_TIME"))
                    .destArrivalTime(rs.getString("DST_ARR_TIME"))
                    .sourceStationCode(rs.getString("SRC_CODE"))
                    .destinationStationCode(rs.getString("DST_CODE"))
                    .availableSeats(rs.getInt("AVAILABLE_SEATS"))
                    .build());
            }
            return results;
        }
    } catch (SQLException e) {
        log.error("Error executing train search: {}", e.getMessage(), e);
        throw new DatabaseOperationException("Failed to query train schedules: " + e.getMessage(), e.getErrorCode(), e);
    }
}
```

---

### Example 2: `PreparedStatement` for INSERT with Sequence Pre-Allocation (New Passenger)
- **Component:** `com.railway.reservation.repository.PassengerRepository`
- **Method:** `save(Passenger passenger)`
- **Concept:** Demonstrates Oracle sequence retrieval (`SEQ_PASSENGER_ID.NEXTVAL`), parameter binding with date types, `executeUpdate()`, and surrogate primary key population.

```java
public Passenger save(Passenger passenger) {
    // 1. Fetch next surrogate ID from Oracle Sequence
    String seqSql = "SELECT SEQ_PASSENGER_ID.NEXTVAL FROM DUAL";
    Long nextId = jdbcTemplate.queryForObject(seqSql, Long.class);

    String insertSql = """
        INSERT INTO PASSENGER (PASSENGER_ID, FULL_NAME, DATE_OF_BIRTH, GENDER, PHONE, EMAIL)
        VALUES (?, ?, ?, ?, ?, ?)
        """;

    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement(insertSql)) {

        // Strict positional binding prevents SQL injection attacks
        ps.setLong(1, nextId);
        ps.setString(2, passenger.getFullName());
        ps.setDate(3, passenger.getDateOfBirth() != null ? java.sql.Date.valueOf(passenger.getDateOfBirth()) : null);
        ps.setString(4, passenger.getGender());
        ps.setString(5, passenger.getPhone());
        ps.setString(6, passenger.getEmail());

        int rowsAffected = ps.executeUpdate();
        log.debug("Inserted passenger id={}, rowsAffected={}", nextId, rowsAffected);

        passenger.setPassengerId(nextId);
        return passenger;
    } catch (SQLException e) {
        log.error("Failed to insert passenger into Oracle: {}", e.getMessage(), e);
        // Translate vendor-specific Oracle codes (e.g. ORA-00001 for duplicate phone/email)
        throw new DatabaseOperationException("Database error saving passenger: " + e.getMessage(), e.getErrorCode(), e);
    }
}
```

---

### Example 3: `CallableStatement` for Stored Procedure with Multiple OUT Parameters (`P_BOOK_TICKET`)
- **Component:** `com.railway.reservation.repository.ReservationRepository`
- **Method:** `bookTicket(BookingRequest request)`
- **Concept:** Demonstrates JDBC procedural invocation (`{CALL P_BOOK_TICKET(?,...)}`), registration of scalar and alphanumeric `OUT` parameters via `java.sql.Types`, parameter binding, and result unpacking.

```java
public BookingResponse bookTicket(BookingRequest request) {
    String sql = "{CALL P_BOOK_TICKET(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
    log.info("Invoking stored procedure P_BOOK_TICKET for passenger={}, schedule={}, seat={}",
            request.getPassengerId(), request.getScheduleId(), request.getSeatId());

    Connection conn = null;
    try {
        conn = dataSource.getConnection();
        conn.setAutoCommit(false); // Begin manual transaction

        try (CallableStatement cs = conn.prepareCall(sql)) {
            // Set 7 IN parameters
            cs.setLong(1, request.getPassengerId());
            cs.setLong(2, request.getScheduleId());
            cs.setLong(3, request.getSourceStationId());
            cs.setLong(4, request.getDestinationStationId());
            cs.setLong(5, request.getSeatId());
            cs.setString(6, request.getPaymentMethod());
            cs.setString(7, request.getSimulatedPaymentStatus() != null ? 
                             request.getSimulatedPaymentStatus() : "SUCCESS");

            // Register 4 OUT parameters
            cs.registerOutParameter(8, Types.NUMERIC); // p_reservation_id
            cs.registerOutParameter(9, Types.VARCHAR); // p_pnr
            cs.registerOutParameter(10, Types.NUMERIC); // p_fare_amount
            cs.registerOutParameter(11, Types.VARCHAR); // p_booking_status

            // Execute stored procedure inside Oracle kernel
            cs.execute();

            // Extract OUT values returned by PL/SQL
            long reservationId = cs.getLong(8);
            String pnr = cs.getString(9);
            BigDecimal fareAmount = cs.getBigDecimal(10);
            String bookingStatus = cs.getString(11);

            // Commit atomic transaction
            conn.commit();
            log.info("Booking committed successfully: PNR={}, status={}", pnr, bookingStatus);

            return BookingResponse.builder()
                    .reservationId(reservationId)
                    .pnr(pnr)
                    .fareAmount(fareAmount)
                    .bookingStatus(bookingStatus)
                    .build();
        } catch (SQLException e) {
            conn.rollback(); // Rollback transaction on procedure failure
            log.error("Stored procedure P_BOOK_TICKET failed [ORA{}]: {}", e.getErrorCode(), e.getMessage());
            throw new DatabaseOperationException(e.getMessage(), e.getErrorCode(), e);
        }
    } catch (SQLException e) {
        throw new DatabaseOperationException("Database connection error: " + e.getMessage(), e);
    } finally {
        if (conn != null) {
            try {
                conn.setAutoCommit(true);
                conn.close(); // Return connection to HikariCP pool
            } catch (SQLException ex) {
                log.error("Failed to reset connection auto-commit state", ex);
            }
        }
    }
}
```

---

### Example 4: `CallableStatement` for User-Defined Stored Function (`F_AVAILABLE_SEAT_COUNT`)
- **Component:** `com.railway.reservation.repository.ReportRepository`
- **Method:** `getAvailableSeatCount(Long scheduleId, String coachClass)`
- **Concept:** Demonstrates invoking an Oracle stored function using JDBC function call syntax (`{ ? = CALL function_name(...) }`), registering the first parameter (`index = 1`) as the return value, and binding optional arguments.

```java
public int getAvailableSeatCount(Long scheduleId, String coachClass) {
    // Function return value is registered at parameter index 1
    String sql = "{ ? = CALL F_AVAILABLE_SEAT_COUNT(?, ?) }";
    log.info("Calling PL/SQL function F_AVAILABLE_SEAT_COUNT for scheduleId={}, coachClass={}", 
             scheduleId, coachClass);

    try (Connection conn = dataSource.getConnection();
         CallableStatement cs = conn.prepareCall(sql)) {

        // Register return parameter type
        cs.registerOutParameter(1, Types.INTEGER);

        // Bind IN arguments
        cs.setLong(2, scheduleId);
        if (coachClass != null && !coachClass.trim().isEmpty()) {
            cs.setString(3, coachClass.trim().toUpperCase());
        } else {
            cs.setNull(3, Types.VARCHAR);
        }

        cs.execute();

        // Retrieve scalar return value
        int availableSeats = cs.getInt(1);
        log.debug("F_AVAILABLE_SEAT_COUNT returned: {}", availableSeats);
        return availableSeats;

    } catch (SQLException e) {
        log.error("Failed to execute function F_AVAILABLE_SEAT_COUNT [ORA{}]: {}", 
                  e.getErrorCode(), e.getMessage());
        throw new DatabaseOperationException(e.getMessage(), e.getErrorCode(), e);
    }
}
```

---

### Example 5: Explicit Transaction Demarcation with Savepoints & Error Rollbacks
- **Component:** `com.railway.reservation.repository.PaymentRepository` / `ReservationRepository`
- **Method:** `executeWithSavepoint(Connection conn, ...)`
- **Concept:** Demonstrates manual transaction control using `conn.setAutoCommit(false)`, `conn.setSavepoint()`, conditional `conn.rollback(savepoint)`, and `conn.commit()`.

```java
public void executeAtomicPaymentRetry(Long reservationId, BigDecimal amount, String method) throws SQLException {
    Connection conn = null;
    Savepoint sp = null;
    try {
        conn = dataSource.getConnection();
        // 1. Enter manual transaction control mode
        conn.setAutoCommit(false);

        // 2. Establish named savepoint prior to risky gateway operation
        sp = conn.setSavepoint("BeforePaymentAttempt");

        // 3. Execute statement 1: Verify current reservation state with row lock
        String lockSql = "SELECT BOOKING_STATUS FROM RESERVATION WHERE RESERVATION_ID = ? FOR UPDATE";
        try (PreparedStatement psLock = conn.prepareStatement(lockSql)) {
            psLock.setLong(1, reservationId);
            try (ResultSet rs = psLock.executeQuery()) {
                if (!rs.next() || !"PENDING".equals(rs.getString("BOOKING_STATUS"))) {
                    throw new IllegalStateException("Reservation is not eligible for payment retry");
                }
            }
        }

        // 4. Execute statement 2: Call procedure to record payment
        String procSql = "{CALL P_RECORD_PAYMENT(?, ?, ?, ?)}";
        try (CallableStatement cs = conn.prepareCall(procSql)) {
            cs.setLong(1, reservationId);
            cs.setBigDecimal(2, amount);
            cs.setString(3, method);
            cs.setString(4, "SUCCESS");
            cs.execute();
        }

        // 5. Commit atomic transaction if all operations succeeded
        conn.commit();
        log.info("Payment retry transaction committed for reservationId={}", reservationId);

    } catch (Exception e) {
        log.warn("Payment attempt failed! Unwinding to savepoint: {}", e.getMessage());
        if (conn != null && sp != null) {
            // Rollback only the uncommitted payment operation
            conn.rollback(sp);
            conn.commit(); // Persist baseline state
        } else if (conn != null) {
            conn.rollback();
        }
        throw new DatabaseOperationException("Payment transaction aborted: " + e.getMessage(), e);
    } finally {
        if (conn != null) {
            conn.setAutoCommit(true);
            conn.close(); // Ensure connection is released to HikariCP pool
        }
    }
}
```

---

## 3. Best Practices & Design Patterns Applied

| Design Pattern / Practice | Academic & Operational Justification |
| :--- | :--- |
| **Try-With-Resources on Statements** | Ensures `PreparedStatement`, `CallableStatement`, and `ResultSet` objects are closed deterministically, preventing cursor leaks in Oracle (`ORA-01000: maximum open cursors exceeded`). |
| **Strict Parameter Index Binding** | Replaces string formatting with strongly typed setters (`setString`, `setLong`, `setDate`), neutralizing SQL injection vectors. |
| **Vendor Error Code Translation** | Traps `SQLException.getErrorCode()` (e.g., `1` for Unique Constraint, `2290` for Check Constraint, `20014` for Double-Booking) to throw typed domain exceptions. |
| **Auto-Commit Reset in `finally`** | Connection pools re-use physical sockets. Always resetting `conn.setAutoCommit(true)` prevents dirty state leakage to subsequent threads. |
