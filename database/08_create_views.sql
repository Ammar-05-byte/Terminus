-- ============================================================================
-- PURPOSE: Create reporting and operational views:
--          1. V_TRAIN_ROUTE - Complete ordered train itinerary with station stops
--          2. V_RESERVATION_DETAILS - Comprehensive passenger booking itinerary
--          3. V_PAYMENT_HISTORY - Audit log of payments, methods, and PNR links
--          4. V_SCHEDULE_AVAILABILITY - Real-time seat availability per schedule
-- ============================================================================

PROMPT ============================================================================
PROMPT Creating Database Views
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VIEW: V_TRAIN_ROUTE
-- Joins TRAIN, TRAIN_STOP, and STATION to present ordered routes with stop
-- sequences, timings, distances, and station metadata.
-- ----------------------------------------------------------------------------
PROMPT Creating View: V_TRAIN_ROUTE...
CREATE OR REPLACE VIEW V_TRAIN_ROUTE AS
SELECT 
    t.train_id,
    t.train_number,
    t.train_name,
    t.train_type,
    t.active_status,
    ts.stop_sequence,
    s.station_id,
    s.station_code,
    s.station_name,
    s.city,
    s.state,
    ts.arrival_time,
    ts.departure_time,
    ts.distance_from_origin_km
FROM TRAIN t
JOIN TRAIN_STOP ts ON t.train_id = ts.train_id
JOIN STATION s     ON ts.station_id = s.station_id;

COMMENT ON TABLE V_TRAIN_ROUTE IS 'Ordered train route itineraries with station details, timings, and cumulative distance.';

-- ----------------------------------------------------------------------------
-- 2. VIEW: V_RESERVATION_DETAILS
-- Consolidates passenger, schedule, train, coach/seat, and station information
-- for an end-to-end view of individual bookings.
-- ----------------------------------------------------------------------------
PROMPT Creating View: V_RESERVATION_DETAILS...
CREATE OR REPLACE VIEW V_RESERVATION_DETAILS AS
SELECT 
    r.reservation_id,
    r.pnr,
    r.booking_status,
    r.booking_timestamp,
    r.fare_amount,
    p.passenger_id,
    p.full_name             AS passenger_name,
    p.phone                 AS passenger_phone,
    p.email                 AS passenger_email,
    sch.schedule_id,
    sch.journey_date,
    sch.scheduled_departure,
    sch.scheduled_arrival,
    t.train_id,
    t.train_number,
    t.train_name,
    r.seat_id,
    st.coach_number,
    st.seat_number,
    st.coach_class,
    st.berth_type,
    src.station_id          AS source_station_id,
    src.station_code        AS source_station_code,
    src.station_name        AS source_station_name,
    dest.station_id         AS destination_station_id,
    dest.station_code       AS dest_station_code,
    dest.station_name       AS dest_station_name
FROM RESERVATION r
JOIN PASSENGER p         ON r.passenger_id = p.passenger_id
JOIN TRAIN_SCHEDULE sch  ON r.schedule_id = sch.schedule_id
JOIN TRAIN t             ON sch.train_id = t.train_id
LEFT JOIN SEAT st        ON r.seat_id = st.seat_id
JOIN STATION src         ON r.source_station_id = src.station_id
JOIN STATION dest        ON r.destination_station_id = dest.station_id;

COMMENT ON TABLE V_RESERVATION_DETAILS IS 'Complete booking records with passenger, journey schedule, train, seat, and station details.';

-- ----------------------------------------------------------------------------
-- 3. VIEW: V_PAYMENT_HISTORY
-- Reconciles gateway payments and refunds against bookings and passenger accounts.
-- ----------------------------------------------------------------------------
PROMPT Creating View: V_PAYMENT_HISTORY...
CREATE OR REPLACE VIEW V_PAYMENT_HISTORY AS
SELECT 
    pay.payment_id,
    pay.transaction_reference,
    pay.payment_timestamp,
    pay.amount,
    pay.payment_method,
    pay.payment_status,
    r.reservation_id,
    r.pnr,
    p.passenger_id,
    p.full_name             AS passenger_name,
    r.booking_status
FROM PAYMENT pay
JOIN RESERVATION r ON pay.reservation_id = r.reservation_id
JOIN PASSENGER p   ON r.passenger_id = p.passenger_id;

COMMENT ON TABLE V_PAYMENT_HISTORY IS 'Financial ledger joining payments, refund transactions, PNRs, and passenger profiles.';

-- ----------------------------------------------------------------------------
-- 4. VIEW: V_SCHEDULE_AVAILABILITY
-- Summarizes train schedules with total rake capacity, active bookings, and
-- remaining available seats (utilizing F_AVAILABLE_SEAT_COUNT).
-- ----------------------------------------------------------------------------
PROMPT Creating View: V_SCHEDULE_AVAILABILITY...
CREATE OR REPLACE VIEW V_SCHEDULE_AVAILABILITY AS
SELECT 
    ts.schedule_id,
    t.train_id,
    t.train_number,
    t.train_name,
    t.train_type,
    ts.journey_date,
    ts.scheduled_departure,
    ts.scheduled_arrival,
    ts.schedule_status,
    (SELECT COUNT(*) FROM SEAT s WHERE s.train_id = t.train_id) AS total_seats,
    (SELECT COUNT(*) 
     FROM RESERVATION r 
     WHERE r.schedule_id = ts.schedule_id 
       AND r.booking_status IN ('PENDING', 'CONFIRMED')
       AND r.seat_id IS NOT NULL) AS booked_seats,
    F_AVAILABLE_SEAT_COUNT(ts.schedule_id) AS available_seats
FROM TRAIN_SCHEDULE ts
JOIN TRAIN t ON ts.train_id = t.train_id;

COMMENT ON TABLE V_SCHEDULE_AVAILABILITY IS 'Real-time schedule seat capacity and availability overview.';

PROMPT ============================================================================
PROMPT Views Created Successfully.
PROMPT ============================================================================
