# Master SQL Query Documentation (Q01 – Q18)

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/SQL_QUERY_DOCUMENTATION.md`  

---

## 1. Overview & Query Classification

The **Terminus Railway Reservation System** incorporates a comprehensive analytical, operational, and auditing suite of **18 advanced SQL queries (Q01 to Q18)**. These queries illustrate the full expressive power of relational algebra, procedural SQL extensions, OLAP analytical aggregations, and window functions implemented in **Oracle Database 19c Enterprise**.

### Category Matrix:
- **Operational / Booking Queries:** Q01, Q02, Q03, Q18
- **Management & Capacity Analytics:** Q04, Q05, Q06, Q11, Q16, Q17
- **Financial & Audit Ledgers:** Q09, Q10, Q12, Q14
- **Customer Intelligence & CRM:** Q07, Q08, Q13, Q15

---

## 2. Detailed Query Catalog (Q01 through Q18)

---

### Q01: Search Available Trains Between Two Stations on a Specific Date
- **Purpose:** Finds all active trains and scheduled trips running between a specified source and destination station where the boarding stop sequence strictly precedes the deboarding sequence, computing journey distance and available seats.
- **Tables Involved:** `TRAIN`, `TRAIN_SCHEDULE`, `TRAIN_STOP` (source & dest), `STATION` (source & dest)
- **Concepts Demonstrated:** Multi-table `INNER JOIN` (6 relations), aliased self-joins on `TRAIN_STOP` and `STATION`, date filtering, PL/SQL function call in `SELECT` list (`F_AVAILABLE_SEAT_COUNT`), sequence comparison filter ($Seq_{src} < Seq_{dest}$).

#### SQL Code:
```sql
SELECT 
    t.train_number,
    t.train_name,
    t.train_type,
    sch.schedule_id,
    sch.journey_date,
    src_stop.departure_time             AS origin_departure,
    dest_stop.arrival_time              AS destination_arrival,
    (dest_stop.distance_from_origin_km - 
     src_stop.distance_from_origin_km)  AS journey_distance_km,
    F_AVAILABLE_SEAT_COUNT(sch.schedule_id) AS available_seats
FROM TRAIN t
JOIN TRAIN_SCHEDULE sch   ON t.train_id = sch.train_id
JOIN TRAIN_STOP src_stop  ON t.train_id = src_stop.train_id
JOIN TRAIN_STOP dest_stop ON t.train_id = dest_stop.train_id
JOIN STATION src_stn      ON src_stop.station_id = src_stn.station_id
JOIN STATION dest_stn     ON dest_stop.station_id = dest_stn.station_id
WHERE t.active_status = 'ACTIVE'
  AND sch.schedule_status = 'SCHEDULED'
  AND src_stn.station_code = :b_src_code
  AND dest_stn.station_code = :b_dest_code
  AND sch.journey_date >= TRUNC(TO_DATE(:b_journey_date, 'YYYY-MM-DD'))
  AND src_stop.stop_sequence < dest_stop.stop_sequence
ORDER BY sch.journey_date, src_stop.departure_time;
```

#### Sample Input:
- `:b_src_code` = `'NDLS'` (New Delhi)
- `:b_dest_code` = `'LKO'` (Lucknow)
- `:b_journey_date` = Current Date

#### Sample Output:
| TRAIN_NUMBER | TRAIN_NAME | TRAIN_TYPE | SCHEDULE_ID | JOURNEY_DATE | ORIGIN_DEPARTURE | DESTINATION_ARRIVAL | JOURNEY_DISTANCE_KM | AVAILABLE_SEATS |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 12004 | Lucknow Shatabdi | Shatabdi | 3 | 2026-11-05 | 06:10 | 12:40 | 511 | 22 |
| 12420 | Gomti Express | Superfast | 4 | 2026-11-05 | 12:20 | 21:30 | 511 | 18 |

---

### Q02: Seat Availability Breakdown by Coach Class for a Given Schedule
- **Purpose:** Aggregates total physical capacity, active reservations (`PENDING` or `CONFIRMED`), remaining unbooked inventory, and percentage occupancy partitioned across all travel classes (`1A`, `2A`, `3A`, `SL`, `CC`, `EC`, `2S`).
- **Tables Involved:** `SEAT`, `TRAIN_SCHEDULE`, `RESERVATION`
- **Concepts Demonstrated:** `LEFT OUTER JOIN` on multi-column join predicate (`schedule_id` and `seat_id`), `GROUP BY`, conditional filtering in join condition, `COUNT()`, mathematical percentage rounding.

#### SQL Code:
```sql
SELECT 
    s.coach_class,
    COUNT(s.seat_id) AS total_capacity,
    COUNT(r.reservation_id) AS booked_count,
    COUNT(s.seat_id) - COUNT(r.reservation_id) AS available_count,
    ROUND((COUNT(r.reservation_id) / COUNT(s.seat_id)) * 100, 2) AS occupancy_pct
FROM TRAIN_SCHEDULE sch
JOIN SEAT s ON sch.train_id = s.train_id
LEFT JOIN RESERVATION r 
       ON sch.schedule_id = r.schedule_id 
      AND s.seat_id = r.seat_id
      AND r.booking_status IN ('PENDING', 'CONFIRMED')
WHERE sch.schedule_id = :b_schedule_id
GROUP BY s.coach_class
ORDER BY s.coach_class;
```

#### Sample Input:
- `:b_schedule_id` = `1`

#### Sample Output:
| COACH_CLASS | TOTAL_CAPACITY | BOOKED_COUNT | AVAILABLE_COUNT | OCCUPANCY_PCT |
| :--- | :---: | :---: | :---: | :---: |
| 1A | 4 | 1 | 3 | 25.00% |
| 2A | 6 | 2 | 4 | 33.33% |
| 3A | 12 | 4 | 8 | 33.33% |
| SL | 16 | 3 | 13 | 18.75% |

---

### Q03: Comprehensive Passenger Booking History and Journey Itinerary
- **Purpose:** Retrieves complete chronological journey itineraries for a passenger, including train number, PNR, assigned coach/berth, source and destination stations, ticket fare, and net payment collected.
- **Tables Involved:** `PASSENGER`, `RESERVATION`, `TRAIN_SCHEDULE`, `TRAIN`, `SEAT`, `STATION` (source & dest)
- **Concepts Demonstrated:** Multi-table joins (7 tables), `LEFT JOIN` for nullable seat allocations, stored function invocation (`F_NET_PAID_AMOUNT`), `ORDER BY` timestamp descending.

#### SQL Code:
```sql
SELECT 
    r.pnr,
    r.booking_timestamp,
    r.booking_status,
    t.train_number,
    t.train_name,
    sch.journey_date,
    src.station_name    AS boarding_station,
    dest.station_name   AS deboarding_station,
    st.coach_number,
    st.seat_number,
    st.coach_class,
    r.fare_amount,
    F_NET_PAID_AMOUNT(r.reservation_id) AS net_paid
FROM PASSENGER p
JOIN RESERVATION r        ON p.passenger_id = r.passenger_id
JOIN TRAIN_SCHEDULE sch   ON r.schedule_id = sch.schedule_id
JOIN TRAIN t              ON sch.train_id = t.train_id
LEFT JOIN SEAT st         ON r.seat_id = st.seat_id
JOIN STATION src          ON r.source_station_id = src.station_id
JOIN STATION dest         ON r.destination_station_id = dest.station_id
WHERE p.passenger_id = :b_passenger_id
ORDER BY r.booking_timestamp DESC;
```

#### Sample Input:
- `:b_passenger_id` = `1`

#### Sample Output:
| PNR | BOOKING_TIMESTAMP | BOOKING_STATUS | TRAIN_NUMBER | TRAIN_NAME | JOURNEY_DATE | BOARDING_STATION | DEBOARDING_STATION | COACH | SEAT | CLASS | FARE (INR) | NET_PAID |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| PNR1000000001 | 2026-11-01 10:30 | CONFIRMED | 12951 | Mumbai Rajdhani | 2026-11-05 | Mumbai Central | New Delhi | A1 | 1 | 1A | 4152.00 | 4152.00 |

---

### Q04: Daily Station-wise Passenger Footfall and Revenue Report
- **Purpose:** Aggregates confirmed passenger boardings and gross revenue collection originating from each station within a rolling travel date window.
- **Tables Involved:** `STATION`, `RESERVATION`, `TRAIN_SCHEDULE`
- **Concepts Demonstrated:** Date arithmetic (`TRUNC(SYSDATE) \pm 10`), aggregation (`COUNT`, `SUM`), `NVL` null-value substitution, multi-column `GROUP BY`.

#### SQL Code:
```sql
SELECT 
    s.station_code,
    s.station_name,
    s.city,
    sch.journey_date,
    COUNT(r.reservation_id) AS passengers_boarded,
    NVL(SUM(r.fare_amount), 0) AS gross_revenue
FROM STATION s
JOIN RESERVATION r      ON s.station_id = r.source_station_id
JOIN TRAIN_SCHEDULE sch ON r.schedule_id = sch.schedule_id
WHERE r.booking_status = 'CONFIRMED'
  AND sch.journey_date BETWEEN TRUNC(SYSDATE) - 10 AND TRUNC(SYSDATE) + 10
GROUP BY s.station_code, s.station_name, s.city, sch.journey_date
ORDER BY sch.journey_date, gross_revenue DESC;
```

#### Sample Output:
| STATION_CODE | STATION_NAME | CITY | JOURNEY_DATE | PASSENGERS_BOARDED | GROSS_REVENUE |
| :--- | :--- | :--- | :---: | :---: | :---: |
| BCT | Mumbai Central | Mumbai | 2026-11-05 | 5 | 14,280.00 |
| NDLS | New Delhi | New Delhi | 2026-11-05 | 4 | 6,850.00 |

---

### Q05: Top 5 Busiest Train Routes by Total Ticket Volume
- **Purpose:** Identifies and ranks the top 5 most heavily traveled station corridors based on total confirmed bookings.
- **Tables Involved:** `RESERVATION`, `STATION` (source & dest)
- **Concepts Demonstrated:** Inline view (derived subquery), Analytic Window function (`DENSE_RANK() OVER (ORDER BY ...)`), string concatenation.

#### SQL Code:
```sql
SELECT *
FROM (
    SELECT 
        src.station_name || ' (' || src.station_code || ')' AS origin_station,
        dest.station_name || ' (' || dest.station_code || ')' AS destination_station,
        COUNT(r.reservation_id) AS total_bookings,
        SUM(r.fare_amount) AS total_revenue,
        DENSE_RANK() OVER (ORDER BY COUNT(r.reservation_id) DESC) AS route_rank
    FROM RESERVATION r
    JOIN STATION src  ON r.source_station_id = src.station_id
    JOIN STATION dest ON r.destination_station_id = dest.station_id
    WHERE r.booking_status = 'CONFIRMED'
    GROUP BY src.station_name, src.station_code, dest.station_name, dest.station_code
)
WHERE route_rank <= 5
ORDER BY total_bookings DESC;
```

#### Sample Output:
| ORIGIN_STATION | DESTINATION_STATION | TOTAL_BOOKINGS | TOTAL_REVENUE | ROUTE_RANK |
| :--- | :--- | :---: | :---: | :---: |
| Mumbai Central (BCT) | New Delhi (NDLS) | 8 | 24,912.00 | 1 |
| New Delhi (NDLS) | Lucknow (LKO) | 5 | 4,250.00 | 2 |
| Howrah Jn (HWH) | New Delhi (NDLS) | 4 | 9,800.00 | 3 |

---

### Q06: Schedule Occupancy Rate and Capacity Utilization Analysis
- **Purpose:** Computes load factors and capacity utilization percentage across all active train schedules to classify trips into demand categories.
- **Tables Involved:** `TRAIN_SCHEDULE`, `TRAIN`, `SEAT`, `RESERVATION`
- **Concepts Demonstrated:** Correlated subqueries in `FROM` clause, aggregation over physical inventory, `NVL` handling, conditional `CASE` expressions.

#### SQL Code:
```sql
SELECT 
    sch.schedule_id,
    t.train_number,
    t.train_name,
    sch.journey_date,
    sch.schedule_status,
    cap.total_capacity,
    NVL(res.booked_count, 0) AS booked_count,
    (cap.total_capacity - NVL(res.booked_count, 0)) AS available_seats,
    ROUND((NVL(res.booked_count, 0) / cap.total_capacity) * 100, 2) AS utilization_pct,
    CASE 
        WHEN (NVL(res.booked_count, 0) / cap.total_capacity) >= 0.8 THEN 'HIGH DEMAND'
        WHEN (NVL(res.booked_count, 0) / cap.total_capacity) >= 0.4 THEN 'MODERATE'
        ELSE 'LOW DEMAND'
    END AS demand_classification
FROM TRAIN_SCHEDULE sch
JOIN TRAIN t ON sch.train_id = t.train_id
JOIN (
    SELECT train_id, COUNT(*) AS total_capacity
    FROM SEAT
    GROUP BY train_id
) cap ON t.train_id = cap.train_id
LEFT JOIN (
    SELECT schedule_id, COUNT(*) AS booked_count
    FROM RESERVATION
    WHERE booking_status IN ('PENDING', 'CONFIRMED')
      AND seat_id IS NOT NULL
    GROUP BY schedule_id
) res ON sch.schedule_id = res.schedule_id
ORDER BY utilization_pct DESC, sch.journey_date;
```

#### Sample Output:
| SCHEDULE_ID | TRAIN_NUMBER | TRAIN_NAME | JOURNEY_DATE | STATUS | CAPACITY | BOOKED | AVAIL | UTIL_PCT | CLASSIFICATION |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| 1 | 12951 | Mumbai Rajdhani | 2026-11-05 | SCHEDULED | 38 | 32 | 6 | 84.21% | HIGH DEMAND |
| 3 | 12004 | Lucknow Shatabdi| 2026-11-05 | SCHEDULED | 30 | 14 | 16 | 46.67% | MODERATE |

---

### Q07: Unconfirmed / Stale Pending Bookings Audit (Expiry Candidates)
- **Purpose:** Identifies all reservations lingering in `PENDING` status exceeding a configurable time threshold, computing exact age in minutes.
- **Tables Involved:** `RESERVATION`, `PASSENGER`, `TRAIN_SCHEDULE`, `TRAIN`
- **Concepts Demonstrated:** Timestamp difference math (`(SYSDATE - CAST(ts AS DATE)) * 24 * 60`), `NUMTODSINTERVAL` filter.

#### SQL Code:
```sql
SELECT 
    r.reservation_id,
    r.pnr,
    r.booking_timestamp,
    ROUND((SYSDATE - CAST(r.booking_timestamp AS DATE)) * 24 * 60, 2) AS age_in_minutes,
    p.full_name         AS passenger_name,
    p.phone             AS contact_phone,
    t.train_number,
    t.train_name,
    sch.journey_date,
    r.fare_amount
FROM RESERVATION r
JOIN PASSENGER p        ON r.passenger_id = p.passenger_id
JOIN TRAIN_SCHEDULE sch ON r.schedule_id = sch.schedule_id
JOIN TRAIN t            ON sch.train_id = t.train_id
WHERE r.booking_status = 'PENDING'
  AND r.booking_timestamp < SYSTIMESTAMP - NUMTODSINTERVAL(:b_stale_mins, 'MINUTE')
ORDER BY r.booking_timestamp ASC;
```

#### Sample Input:
- `:b_stale_mins` = `15`

---

### Q08: Passenger Travel Frequency and Loyalty Tier Classification
- **Purpose:** Classifies travelers into Platinum, Gold, Silver, or Bronze loyalty tiers based on lifetime confirmed journeys and aggregate spend.
- **Tables Involved:** `PASSENGER`, `RESERVATION`
- **Concepts Demonstrated:** Conditional aggregation inside `COUNT(CASE ...)` and `SUM(CASE ...)`, multi-tier `CASE` expression, `LEFT OUTER JOIN`.

#### SQL Code:
```sql
SELECT 
    p.passenger_id,
    p.full_name,
    p.email,
    p.phone,
    COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END) AS confirmed_trips,
    COUNT(CASE WHEN r.booking_status = 'CANCELLED' THEN 1 END) AS cancelled_trips,
    NVL(SUM(CASE WHEN r.booking_status = 'CONFIRMED' THEN r.fare_amount ELSE 0 END), 0) AS lifetime_confirmed_spend,
    CASE 
        WHEN COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END) >= 3 THEN 'PLATINUM'
        WHEN COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END) = 2  THEN 'GOLD'
        WHEN COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END) = 1  THEN 'SILVER'
        ELSE 'BRONZE'
    END AS loyalty_tier
FROM PASSENGER p
LEFT JOIN RESERVATION r ON p.passenger_id = r.passenger_id
GROUP BY p.passenger_id, p.full_name, p.email, p.phone
ORDER BY lifetime_confirmed_spend DESC, confirmed_trips DESC;
```

#### Sample Output:
| PASSENGER_ID | FULL_NAME | EMAIL | CONFIRMED_TRIPS | CANCELLED_TRIPS | LIFETIME_SPEND | LOYALTY_TIER |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | Rahul Sharma | rahul.sharma@example.com | 3 | 0 | 9,850.00 | PLATINUM |
| 2 | Priya Patel | priya.patel@example.com | 2 | 1 | 5,420.00 | GOLD |
| 4 | Amit Kumar | amit.kumar@example.com | 1 | 0 | 1,250.00 | SILVER |

---

### Q09: Payment Method Performance and Gateway Settlement Success Rate
- **Purpose:** Evaluates settlement channel efficiency across UPI, CARD, NET_BANKING, and CASH, measuring success vs. failure ratios.
- **Tables Involved:** `PAYMENT`
- **Concepts Demonstrated:** Conditional counting, `NULLIF` division-by-zero guard, financial aggregation.

#### SQL Code:
```sql
SELECT 
    payment_method,
    COUNT(*) AS total_transactions,
    COUNT(CASE WHEN payment_status = 'SUCCESS' THEN 1 END) AS success_count,
    COUNT(CASE WHEN payment_status = 'FAILED' THEN 1 END) AS failed_count,
    COUNT(CASE WHEN payment_status = 'REFUND_SUCCESS' THEN 1 END) AS refund_count,
    NVL(SUM(CASE WHEN payment_status = 'SUCCESS' THEN amount ELSE 0 END), 0) AS total_settled_amount,
    ROUND(
        (COUNT(CASE WHEN payment_status = 'SUCCESS' THEN 1 END) / 
         NULLIF(COUNT(CASE WHEN payment_status IN ('SUCCESS','FAILED') THEN 1 END), 0)) * 100, 
        2
    ) AS success_rate_pct
FROM PAYMENT
GROUP BY payment_method
ORDER BY total_settled_amount DESC;
```

#### Sample Output:
| PAYMENT_METHOD | TOTAL_TXNS | SUCCESS_COUNT | FAILED_COUNT | REFUND_COUNT | TOTAL_SETTLED | SUCCESS_RATE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| CARD | 8 | 7 | 1 | 0 | 18,450.00 | 87.50% |
| UPI | 10 | 9 | 1 | 0 | 12,300.00 | 90.00% |
| NET_BANKING | 4 | 4 | 0 | 0 | 8,920.00 | 100.00% |

---

### Q10: Refund Reconciliation and Audit Ledger
- **Purpose:** Audits cancelled bookings against refunded disbursements to identify pending refund variances or discrepancy errors.
- **Tables Involved:** `RESERVATION`, `PAYMENT`, `PASSENGER`
- **Concepts Demonstrated:** Multiple derived aggregation joins, accounting reconciliation logic, `CASE` statement diagnosis.

#### SQL Code:
```sql
SELECT 
    r.pnr,
    r.reservation_id,
    p.full_name AS passenger_name,
    r.fare_amount AS original_fare,
    NVL(p_orig.captured_amount, 0) AS original_captured,
    NVL(p_ref.refunded_amount, 0)  AS refunded_amount,
    (NVL(p_orig.captured_amount, 0) - NVL(p_ref.refunded_amount, 0)) AS refund_variance,
    CASE 
        WHEN NVL(p_orig.captured_amount, 0) = NVL(p_ref.refunded_amount, 0) THEN 'RECONCILED'
        WHEN NVL(p_orig.captured_amount, 0) > NVL(p_ref.refunded_amount, 0) THEN 'REFUND PENDING'
        ELSE 'OVER-REFUND ERROR'
    END AS reconciliation_status
FROM RESERVATION r
JOIN PASSENGER p ON r.passenger_id = p.passenger_id
LEFT JOIN (
    SELECT reservation_id, SUM(amount) AS captured_amount
    FROM PAYMENT
    WHERE payment_status = 'SUCCESS'
    GROUP BY reservation_id
) p_orig ON r.reservation_id = p_orig.reservation_id
LEFT JOIN (
    SELECT reservation_id, SUM(amount) AS refunded_amount
    FROM PAYMENT
    WHERE payment_status = 'REFUND_SUCCESS'
    GROUP BY reservation_id
) p_ref ON r.reservation_id = p_ref.reservation_id
WHERE r.booking_status = 'CANCELLED'
ORDER BY r.reservation_id;
```

#### Sample Output:
| PNR | RES_ID | PASSENGER_NAME | ORIGINAL_FARE | CAPTURED | REFUNDED | VARIANCE | STATUS |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| PNR1000000008 | 8 | Suresh Raina | 885.60 | 885.60 | 885.60 | 0.00 | RECONCILED |

---

### Q11: Station Transit & Congestion Analysis (Originating, Terminating, Halts)
- **Purpose:** Classifies rail traffic distribution per station into services originating, services terminating, and intermediate halts.
- **Tables Involved:** `STATION`, `TRAIN_STOP`, `TRAIN`
- **Concepts Demonstrated:** Subquery finding maximum stop sequence per train, conditional counting on stop sequence index.

#### SQL Code:
```sql
SELECT 
    s.station_code,
    s.station_name,
    s.city,
    COUNT(CASE WHEN ts.stop_sequence = 1 THEN 1 END) AS originating_trains,
    COUNT(CASE WHEN ts.stop_sequence = term.max_seq THEN 1 END) AS terminating_trains,
    COUNT(CASE WHEN ts.stop_sequence > 1 AND ts.stop_sequence < term.max_seq THEN 1 END) AS intermediate_halts,
    COUNT(ts.train_id) AS total_serviced_trains
FROM STATION s
JOIN TRAIN_STOP ts ON s.station_id = ts.station_id
JOIN (
    SELECT train_id, MAX(stop_sequence) AS max_seq
    FROM TRAIN_STOP
    GROUP BY train_id
) term ON ts.train_id = term.train_id
GROUP BY s.station_code, s.station_name, s.city
ORDER BY total_serviced_trains DESC, originating_trains DESC;
```

---

### Q12: Class-wise Revenue Yield per Kilometer Analysis
- **Purpose:** Calculates financial yields per passenger-kilometer across all travel classes (`SL`, `3A`, `2A`, `1A`, `CC`).
- **Tables Involved:** `RESERVATION`, `SEAT`, `TRAIN_SCHEDULE`, `TRAIN_STOP` (source & dest)
- **Concepts Demonstrated:** Metric calculation ($\text{Revenue} / \text{Passenger-KM}$), multi-table route joins, aggregation.

#### SQL Code:
```sql
SELECT 
    st.coach_class,
    COUNT(r.reservation_id) AS confirmed_passengers,
    SUM(r.fare_amount) AS total_class_revenue,
    SUM(dest_stop.distance_from_origin_km - src_stop.distance_from_origin_km) AS total_passenger_km,
    ROUND(
        SUM(r.fare_amount) / 
        NULLIF(SUM(dest_stop.distance_from_origin_km - src_stop.distance_from_origin_km), 0), 
        4
    ) AS effective_yield_per_pkm,
    ROUND(AVG(r.fare_amount), 2) AS average_ticket_fare
FROM RESERVATION r
JOIN SEAT st ON r.seat_id = st.seat_id
JOIN TRAIN_SCHEDULE sch ON r.schedule_id = sch.schedule_id
JOIN TRAIN_STOP src_stop ON sch.train_id = src_stop.train_id AND r.source_station_id = src_stop.station_id
JOIN TRAIN_STOP dest_stop ON sch.train_id = dest_stop.train_id AND r.destination_station_id = dest_stop.station_id
WHERE r.booking_status = 'CONFIRMED'
GROUP BY st.coach_class
ORDER BY total_class_revenue DESC;
```

---

### Q13: Longest Distance Journeys Booked vs System Average Trip Distance
- **Purpose:** Benchmarks individual passenger trip distances against the system-wide average journey length using analytic window functions.
- **Tables Involved:** `RESERVATION`, `PASSENGER`, `TRAIN_SCHEDULE`, `TRAIN`, `TRAIN_STOP` (source & dest)
- **Concepts Demonstrated:** `AVG() OVER ()` window function without a partition clause, row-level variance calculation.

#### SQL Code:
```sql
SELECT 
    r.pnr,
    p.full_name AS passenger_name,
    t.train_number,
    t.train_name,
    (dest_stop.distance_from_origin_km - src_stop.distance_from_origin_km) AS journey_distance_km,
    ROUND(AVG(dest_stop.distance_from_origin_km - src_stop.distance_from_origin_km) OVER (), 2) AS overall_avg_distance_km,
    ROUND(
        (dest_stop.distance_from_origin_km - src_stop.distance_from_origin_km) - 
        AVG(dest_stop.distance_from_origin_km - src_stop.distance_from_origin_km) OVER (), 
        2
    ) AS variance_from_average_km,
    r.fare_amount
FROM RESERVATION r
JOIN PASSENGER p ON r.passenger_id = p.passenger_id
JOIN TRAIN_SCHEDULE sch ON r.schedule_id = sch.schedule_id
JOIN TRAIN t ON sch.train_id = t.train_id
JOIN TRAIN_STOP src_stop ON sch.train_id = src_stop.train_id AND r.source_station_id = src_stop.station_id
JOIN TRAIN_STOP dest_stop ON sch.train_id = dest_stop.train_id AND r.destination_station_id = dest_stop.station_id
WHERE r.booking_status = 'CONFIRMED'
ORDER BY journey_distance_km DESC;
```

---

### Q14: Integrity Audit: Active Seat Overlap & Double-Booking Audit
- **Purpose:** Database health check validating that zero physical seats have overlapping active (`PENDING` or `CONFIRMED`) bookings on the same schedule (must return 0 rows).
- **Tables Involved:** `RESERVATION`
- **Concepts Demonstrated:** String aggregation (`LISTAGG() WITHIN GROUP`), `HAVING COUNT(*) > 1`.

#### SQL Code:
```sql
SELECT 
    schedule_id,
    seat_id,
    COUNT(*) AS active_reservation_count,
    LISTAGG(pnr, ', ') WITHIN GROUP (ORDER BY reservation_id) AS conflicting_pnrs
FROM RESERVATION
WHERE booking_status IN ('PENDING', 'CONFIRMED')
  AND seat_id IS NOT NULL
GROUP BY schedule_id, seat_id
HAVING COUNT(*) > 1;
```
*Expected Result: 0 rows returned.*

---

### Q15: High-Value Passengers (VIP) with Preferred Payment Channels
- **Purpose:** Identifies VIP passengers with total spend exceeding a threshold and finds their most frequently chosen payment channel.
- **Tables Involved:** `PASSENGER`, `RESERVATION`, `PAYMENT`
- **Concepts Demonstrated:** Common Table Expressions (`WITH`), Window Ranking (`ROW_NUMBER() OVER (PARTITION BY ...)`).

#### SQL Code:
```sql
WITH passenger_payments AS (
    SELECT 
        p.passenger_id,
        p.full_name,
        p.phone,
        pay.payment_method,
        SUM(pay.amount) AS method_spend,
        COUNT(pay.payment_id) AS txn_count,
        ROW_NUMBER() OVER (
            PARTITION BY p.passenger_id 
            ORDER BY COUNT(pay.payment_id) DESC, SUM(pay.amount) DESC
        ) AS pref_rank
    FROM PASSENGER p
    JOIN RESERVATION r ON p.passenger_id = r.passenger_id
    JOIN PAYMENT pay   ON r.reservation_id = pay.reservation_id
    WHERE pay.payment_status = 'SUCCESS'
    GROUP BY p.passenger_id, p.full_name, p.phone, pay.payment_method
),
passenger_totals AS (
    SELECT 
        p.passenger_id,
        p.full_name,
        SUM(pay.amount) AS total_lifetime_spend,
        COUNT(DISTINCT r.reservation_id) AS total_confirmed_bookings
    FROM PASSENGER p
    JOIN RESERVATION r ON p.passenger_id = r.passenger_id
    JOIN PAYMENT pay   ON r.reservation_id = pay.reservation_id
    WHERE pay.payment_status = 'SUCCESS'
    GROUP BY p.passenger_id, p.full_name
    HAVING SUM(pay.amount) >= :b_vip_threshold
)
SELECT 
    pt.passenger_id,
    pt.full_name,
    pt.total_confirmed_bookings,
    pt.total_lifetime_spend,
    pp.payment_method AS preferred_payment_channel,
    pp.txn_count     AS transactions_in_preferred_channel
FROM passenger_totals pt
JOIN passenger_payments pp 
  ON pt.passenger_id = pp.passenger_id 
 AND pp.pref_rank = 1
ORDER BY pt.total_lifetime_spend DESC;
```

---

### Q16: Train Halt Duration and Technical Stop Schedule Analysis
- **Purpose:** Computes the scheduled dwell time (in minutes) at intermediate halts to analyze route bottlenecks.
- **Tables Involved:** `TRAIN`, `TRAIN_STOP`, `STATION`
- **Concepts Demonstrated:** Time difference math using `TO_DATE` with format `'HH24:MI'`.

#### SQL Code:
```sql
SELECT 
    t.train_number,
    t.train_name,
    ts.stop_sequence,
    s.station_code,
    s.station_name,
    ts.arrival_time,
    ts.departure_time,
    ROUND((TO_DATE(ts.departure_time, 'HH24:MI') - TO_DATE(ts.arrival_time, 'HH24:MI')) * 24 * 60) AS halt_minutes,
    ts.distance_from_origin_km
FROM TRAIN t
JOIN TRAIN_STOP ts ON t.train_id = ts.train_id
JOIN STATION s     ON ts.station_id = s.station_id
WHERE ts.arrival_time IS NOT NULL 
  AND ts.departure_time IS NOT NULL
ORDER BY t.train_number, ts.stop_sequence;
```

---

### Q17: Peak Journey Day Analysis by Day of Week
- **Purpose:** Analyzes booking volumes and revenue aggregated by day of the week to aid rolling stock dispatching.
- **Tables Involved:** `TRAIN_SCHEDULE`, `RESERVATION`
- **Concepts Demonstrated:** Date format extraction (`TO_CHAR(date, 'FMDAY')`, `TO_CHAR(date, 'D')`), day indexing.

#### SQL Code:
```sql
SELECT 
    TO_CHAR(sch.journey_date, 'FMDAY') AS day_of_week,
    TO_NUMBER(TO_CHAR(sch.journey_date, 'D')) AS day_index,
    COUNT(r.reservation_id) AS total_reservations,
    COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END) AS confirmed_reservations,
    NVL(SUM(CASE WHEN r.booking_status = 'CONFIRMED' THEN r.fare_amount ELSE 0 END), 0) AS gross_revenue,
    ROUND(AVG(CASE WHEN r.booking_status = 'CONFIRMED' THEN r.fare_amount END), 2) AS avg_fare_per_ticket
FROM TRAIN_SCHEDULE sch
LEFT JOIN RESERVATION r ON sch.schedule_id = r.schedule_id
GROUP BY TO_CHAR(sch.journey_date, 'FMDAY'), TO_NUMBER(TO_CHAR(sch.journey_date, 'D'))
ORDER BY day_index;
```

---

### Q18: Schedule Coach & Berth Allocation Matrix (Real-Time Seat Map)
- **Purpose:** Generates a real-time seat allocation map for a train schedule, displaying coach number, seat number, berth position, and whether it is `AVAILABLE`, `PENDING`, or `CONFIRMED`.
- **Tables Involved:** `SEAT`, `TRAIN_SCHEDULE`, `RESERVATION`, `PASSENGER`
- **Concepts Demonstrated:** `LEFT OUTER JOIN` over active bookings, passenger name mapping, `NVL` status fallback.

#### SQL Code:
```sql
SELECT 
    sch.schedule_id,
    sch.journey_date,
    s.coach_number,
    s.seat_number,
    s.coach_class,
    s.berth_type,
    NVL(r.booking_status, 'AVAILABLE') AS seat_status,
    r.pnr,
    p.full_name AS passenger_name
FROM TRAIN_SCHEDULE sch
JOIN SEAT s ON sch.train_id = s.train_id
LEFT JOIN RESERVATION r 
       ON sch.schedule_id = r.schedule_id 
      AND s.seat_id = r.seat_id
      AND r.booking_status IN ('PENDING', 'CONFIRMED')
LEFT JOIN PASSENGER p ON r.passenger_id = p.passenger_id
WHERE sch.schedule_id = :b_map_schedule_id
ORDER BY s.coach_number, s.seat_number;
```

#### Sample Input:
- `:b_map_schedule_id` = `1`
