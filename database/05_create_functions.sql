-- ============================================================================
-- PURPOSE: Create business calculation and aggregation functions:
--          1. F_CALCULATE_FARE - Computes distance- and class-based ticket fare
--          2. F_AVAILABLE_SEAT_COUNT - Returns remaining available seats per schedule
--          3. F_NET_PAID_AMOUNT - Calculates net successful payment for a reservation
-- ============================================================================

PROMPT ============================================================================
PROMPT Creating Business PL/SQL Functions
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCTION: F_CALCULATE_FARE
-- Calculates ticket fare based on travel distance between source and destination
-- stops and the coach class rate multiplier, enforcing a minimum fare of 50.
-- ----------------------------------------------------------------------------
PROMPT Creating Function: F_CALCULATE_FARE...
CREATE OR REPLACE FUNCTION F_CALCULATE_FARE (
    p_schedule_id          IN NUMBER,
    p_source_station_id    IN NUMBER,
    p_dest_station_id      IN NUMBER,
    p_seat_id              IN NUMBER
) RETURN NUMBER
IS
    v_train_id         TRAIN_SCHEDULE.train_id%TYPE;
    v_src_dist         TRAIN_STOP.distance_from_origin_km%TYPE;
    v_dest_dist        TRAIN_STOP.distance_from_origin_km%TYPE;
    v_travel_dist      NUMBER;
    v_coach_class      SEAT.coach_class%TYPE;
    v_rate_per_km      NUMBER;
    v_base_fare        NUMBER;
BEGIN
    -- 1. Resolve train_id from schedule
    SELECT train_id
    INTO v_train_id
    FROM TRAIN_SCHEDULE
    WHERE schedule_id = p_schedule_id;

    -- 2. Retrieve cumulative distance for source station
    SELECT distance_from_origin_km
    INTO v_src_dist
    FROM TRAIN_STOP
    WHERE train_id = v_train_id
      AND station_id = p_source_station_id;

    -- 3. Retrieve cumulative distance for destination station
    SELECT distance_from_origin_km
    INTO v_dest_dist
    FROM TRAIN_STOP
    WHERE train_id = v_train_id
      AND station_id = p_dest_station_id;

    -- 4. Calculate actual travel distance
    v_travel_dist := v_dest_dist - v_src_dist;
    IF v_travel_dist <= 0 THEN
        RAISE_APPLICATION_ERROR(-20015, 'Fare calculation error: Destination distance (' || v_dest_dist || 
                                ' km) must exceed source distance (' || v_src_dist || ' km).');
    END IF;

    -- 5. Retrieve coach class from allocated seat
    SELECT coach_class
    INTO v_coach_class
    FROM SEAT
    WHERE seat_id = p_seat_id;

    -- 6. Apply rate multiplier per km based on coach class:
    --    SL=0.50, 3A=1.20, 2A=1.80, 1A=3.00, CC=1.50, 2S=0.30, EC=2.50
    CASE v_coach_class
        WHEN 'SL' THEN v_rate_per_km := 0.50;
        WHEN '3A' THEN v_rate_per_km := 1.20;
        WHEN '2A' THEN v_rate_per_km := 1.80;
        WHEN '1A' THEN v_rate_per_km := 3.00;
        WHEN 'CC' THEN v_rate_per_km := 1.50;
        WHEN '2S' THEN v_rate_per_km := 0.30;
        WHEN 'EC' THEN v_rate_per_km := 2.50;
        ELSE           v_rate_per_km := 0.50;
    END CASE;

    -- 7. Compute base fare with minimum floor of 50.00
    v_base_fare := v_travel_dist * v_rate_per_km;
    IF v_base_fare < 50.00 THEN
        v_base_fare := 50.00;
    END IF;

    RETURN ROUND(v_base_fare, 2);

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20016, 'Fare calculation failed: Specified schedule, stations, or seat not found in route.');
    WHEN OTHERS THEN
        RAISE;
END F_CALCULATE_FARE;
/

-- ----------------------------------------------------------------------------
-- 2. FUNCTION: F_AVAILABLE_SEAT_COUNT
-- Returns total remaining unbooked seats for a given train schedule, optionally
-- filtered by travel class. Excludes seats held in PENDING or CONFIRMED bookings.
-- ----------------------------------------------------------------------------
PROMPT Creating Function: F_AVAILABLE_SEAT_COUNT...
CREATE OR REPLACE FUNCTION F_AVAILABLE_SEAT_COUNT (
    p_schedule_id    IN NUMBER,
    p_coach_class    IN VARCHAR2 DEFAULT NULL
) RETURN NUMBER
IS
    v_train_id       TRAIN_SCHEDULE.train_id%TYPE;
    v_avail_count    NUMBER := 0;
BEGIN
    -- 1. Identify train assigned to schedule
    SELECT train_id
    INTO v_train_id
    FROM TRAIN_SCHEDULE
    WHERE schedule_id = p_schedule_id;

    -- 2. Count seats for the train not committed in active reservations
    SELECT COUNT(*)
    INTO v_avail_count
    FROM SEAT s
    WHERE s.train_id = v_train_id
      AND (p_coach_class IS NULL OR s.coach_class = p_coach_class)
      AND s.seat_id NOT IN (
          SELECT r.seat_id
          FROM RESERVATION r
          WHERE r.schedule_id = p_schedule_id
            AND r.seat_id IS NOT NULL
            AND r.booking_status IN ('PENDING', 'CONFIRMED')
      );

    RETURN v_avail_count;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        RAISE;
END F_AVAILABLE_SEAT_COUNT;
/

-- ----------------------------------------------------------------------------
-- 3. FUNCTION: F_NET_PAID_AMOUNT
-- Aggregates successful payments minus successful refunds for a reservation.
-- Returns 0 if no successful payments exist.
-- ----------------------------------------------------------------------------
PROMPT Creating Function: F_NET_PAID_AMOUNT...
CREATE OR REPLACE FUNCTION F_NET_PAID_AMOUNT (
    p_reservation_id IN NUMBER
) RETURN NUMBER
IS
    v_net_amount NUMBER := 0;
BEGIN
    SELECT NVL(SUM(CASE 
                     WHEN payment_status = 'SUCCESS' THEN amount
                     WHEN payment_status = 'REFUND_SUCCESS' THEN -amount
                     ELSE 0
                   END), 0)
    INTO v_net_amount
    FROM PAYMENT
    WHERE reservation_id = p_reservation_id;

    -- Ensure non-negative return value
    RETURN GREATEST(0, v_net_amount);

EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END F_NET_PAID_AMOUNT;
/

PROMPT ============================================================================
PROMPT Functions Created Successfully.
PROMPT ============================================================================
