-- ============================================================================
SET DEFINE OFF;
-- PURPOSE: Master suite of 18 analytical, operational, and audit SQL queries
--          (Q01 to Q18) demonstrating complex relational DBMS features:
--          joins, aggregations, window functions, analytic rankings, subqueries,
--          date arithmetic, and integrity checks.
-- ============================================================================
SET DEFINE OFF;

-- ============================================================================
SET DEFINE OFF;
-- Q01: Search Available Trains Between Two Stations on a Specific Date
-- PURPOSE: Finds all active trains and schedules running between a specified
--          source and destination station where boarding sequence precedes
--          deboarding sequence, calculating travel distance and duration.
-- TABLES INVOLVED: TRAIN, TRAIN_SCHEDULE, TRAIN_STOP (src, dest), STATION (src, dest)
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q01: Search Available Trains Between Stations
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- Sample Execution:
VARIABLE b_src_code VARCHAR2(10);
VARIABLE b_dest_code VARCHAR2(10);
VARIABLE b_journey_date VARCHAR2(10);
EXEC :b_src_code := 'NDLS'; :b_dest_code := 'LKO'; :b_journey_date := TO_CHAR(SYSDATE, 'YYYY-MM-DD');
/

-- ============================================================================
SET DEFINE OFF;
-- Q02: Seat Availability Breakdown by Coach Class for a Given Schedule
-- PURPOSE: Aggregates total physical seats, reserved seats, and available seats
--          grouped by travel class (1A, 2A, 3A, SL, CC, EC, 2S) for a specific trip.
-- TABLES INVOLVED: SEAT, TRAIN_SCHEDULE, RESERVATION
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q02: Seat Availability Breakdown by Coach Class
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- Sample Execution:
VARIABLE b_schedule_id NUMBER;
EXEC :b_schedule_id := 1;
/

-- ============================================================================
SET DEFINE OFF;
-- Q03: Comprehensive Passenger Booking History and Journey Itinerary
-- PURPOSE: Retrieves complete travel history for a passenger, including train,
--          PNR, journey date, assigned seat, stations, and payment status.
-- TABLES INVOLVED: PASSENGER, RESERVATION, TRAIN_SCHEDULE, TRAIN, SEAT, STATION
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q03: Passenger Booking History and Journey Itinerary
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- Sample Execution:
VARIABLE b_passenger_id NUMBER;
EXEC :b_passenger_id := 1;
/

-- ============================================================================
SET DEFINE OFF;
-- Q04: Daily Station-wise Passenger Footfall and Revenue Report
-- PURPOSE: Aggregates confirmed passenger departures and gross ticket revenue
--          originating from each station within a given date window.
-- TABLES INVOLVED: RESERVATION, STATION, TRAIN_SCHEDULE
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q04: Daily Station-wise Passenger Footfall and Revenue
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q05: Top 5 Busiest Train Routes by Total Ticket Volume
-- PURPOSE: Identifies the top 5 most heavily traveled station-to-station corridors
--          ranked by confirmed reservation counts.
-- TABLES INVOLVED: RESERVATION, STATION (src, dest)
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q05: Top 5 Busiest Train Routes
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q06: Schedule Occupancy Rate and Capacity Utilization Analysis
-- PURPOSE: Computes the load factor and percentage capacity utilization across
--          all active train schedules to optimize fleet scheduling.
-- TABLES INVOLVED: TRAIN_SCHEDULE, TRAIN, SEAT, RESERVATION
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q06: Schedule Occupancy Rate and Capacity Utilization
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q07: Unconfirmed / Stale Pending Bookings Audit (Expiry Candidates)
-- PURPOSE: Lists all reservations stuck in 'PENDING' status older than a given
--          threshold in minutes, ready to be swept by P_EXPIRE_STALE_RESERVATIONS.
-- TABLES INVOLVED: RESERVATION, PASSENGER, TRAIN_SCHEDULE, TRAIN
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q07: Unconfirmed / Stale Pending Bookings Audit
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- Sample Execution:
VARIABLE b_stale_mins NUMBER;
EXEC :b_stale_mins := 2;
/

-- ============================================================================
SET DEFINE OFF;
-- Q08: Passenger Travel Frequency and Loyalty Tier Classification
-- PURPOSE: Analyzes passenger booking history and classifies travelers into
--          Platinum, Gold, Silver, or Bronze loyalty tiers based on trip volume.
-- TABLES INVOLVED: PASSENGER, RESERVATION
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q08: Passenger Loyalty Tier Classification
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q09: Payment Method Performance and Gateway Settlement Success Rate
-- PURPOSE: Evaluates transaction processing efficiency across settlement channels
--          (UPI, Card, Net Banking, Cash) measuring failure and success rates.
-- TABLES INVOLVED: PAYMENT
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q09: Payment Method Performance & Settlement Success Rate
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q10: Refund Reconciliation and Audit Ledger
-- PURPOSE: Audits cancelled tickets against refunded payments to ensure 100%
--          financial reconciliation and identify pending refund discrepancies.
-- TABLES INVOLVED: RESERVATION, PAYMENT, PASSENGER
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q10: Refund Reconciliation and Audit Ledger
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q11: Station Transit & Congestion Analysis (Originating, Terminating, Halts)
-- PURPOSE: Quantifies rail traffic distribution per station: services originating,
--          services terminating, and intermediate stopping services.
-- TABLES INVOLVED: STATION, TRAIN_STOP, TRAIN
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q11: Station Transit and Congestion Analysis
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q12: Class-wise Revenue Yield per Kilometer Analysis
-- PURPOSE: Computes financial yields per passenger-kilometer across all travel
--          classes (SL, 3A, 2A, 1A, CC, EC, 2S).
-- TABLES INVOLVED: RESERVATION, SEAT, TRAIN_STOP (src, dest)
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q12: Class-wise Revenue Yield per Passenger-Kilometer
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q13: Longest Distance Journeys Booked vs System Average Trip Distance
-- PURPOSE: Utilizes analytic window functions to benchmark individual journey
--          lengths against the system-wide average travel distance.
-- TABLES INVOLVED: RESERVATION, TRAIN_STOP (src, dest), PASSENGER, TRAIN, TRAIN_SCHEDULE
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q13: Longest Distance Journeys vs System Average
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q14: Integrity Audit: Active Seat Overlap & Double-Booking Audit
-- PURPOSE: Database consistency check validating that no physical seat is
--          concurrently booked in active status on the same schedule (must return 0 rows).
-- TABLES INVOLVED: RESERVATION
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q14: Active Seat Overlap and Double-Booking Audit
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q15: High-Value Passengers (VIP) with Preferred Payment Channels
-- PURPOSE: Identifies passengers with cumulative spend exceeding INR 2000,
--          determining their most frequently utilized payment method.
-- TABLES INVOLVED: PASSENGER, RESERVATION, PAYMENT
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q15: High-Value Passengers with Preferred Payment Channels
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- Sample Execution:
VARIABLE b_vip_threshold NUMBER;
EXEC :b_vip_threshold := 2000;
/

-- ============================================================================
SET DEFINE OFF;
-- Q16: Train Halt Duration and Technical Stop Schedule Analysis
-- PURPOSE: Calculates the scheduled dwell time (in minutes) at each intermediate
--          station stop along train routes to detect bottlenecks.
-- TABLES INVOLVED: TRAIN, TRAIN_STOP, STATION
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q16: Train Halt Duration and Technical Stop Analysis
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q17: Peak Journey Day Analysis by Day of Week
-- PURPOSE: Aggregates historical and scheduled passenger booking demand by day
--          of the week to assist fleet operations with rolling stock planning.
-- TABLES INVOLVED: TRAIN_SCHEDULE, RESERVATION
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q17: Peak Journey Day Analysis by Day of Week
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- ============================================================================
SET DEFINE OFF;
-- Q18: Schedule Coach & Berth Allocation Matrix (Real-Time Seat Map)
-- PURPOSE: Produces a complete seat map matrix for a given schedule showing every
--          coach, seat number, berth type, and its current reservation status.
-- TABLES INVOLVED: SEAT, TRAIN_SCHEDULE, RESERVATION, PASSENGER
-- ============================================================================
SET DEFINE OFF;
PROMPT ------------------------------------------------------------------------
PROMPT Q18: Schedule Coach and Berth Allocation Matrix (Seat Map)
PROMPT ------------------------------------------------------------------------

-- Query Definition:
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

-- Sample Execution:
VARIABLE b_map_schedule_id NUMBER;
EXEC :b_map_schedule_id := 1;
/

PROMPT ============================================================================
PROMPT All 18 Queries Executed Successfully.
PROMPT ============================================================================
