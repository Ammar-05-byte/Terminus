-- ============================================================================
-- PURPOSE: Create transactional PL/SQL business procedures:
--          1. P_BOOK_TICKET - End-to-end atomic ticket booking workflow
--          2. P_RECORD_PAYMENT - Payment gateway settlement & refund processing
--          3. P_CANCEL_RESERVATION - Booking cancellation and refund triggering
--          4. P_EXPIRE_STALE_RESERVATIONS - Batch cleanup of pending hold reservations
-- CRITICAL: NO COMMIT inside any procedure; caller controls transactions.
-- ============================================================================

PROMPT ============================================================================
PROMPT Creating Business PL/SQL Procedures
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROCEDURE: P_RECORD_PAYMENT
-- Inserts payment or refund transaction records and enforces status prerequisites.
-- Called both directly and by P_BOOK_TICKET / P_CANCEL_RESERVATION.
-- ----------------------------------------------------------------------------
PROMPT Creating Procedure: P_RECORD_PAYMENT...
CREATE OR REPLACE PROCEDURE P_RECORD_PAYMENT (
    p_reservation_id IN NUMBER,
    p_amount         IN NUMBER,
    p_payment_method IN VARCHAR2,
    p_payment_status IN VARCHAR2
)
IS
    v_res_status  RESERVATION.booking_status%TYPE;
    v_res_fare    RESERVATION.fare_amount%TYPE;
    v_txn_ref     VARCHAR2(50);
BEGIN
    -- 1. Validate reservation exists and acquire row-level lock
    BEGIN
        SELECT booking_status, fare_amount
        INTO v_res_status, v_res_fare
        FROM RESERVATION
        WHERE reservation_id = p_reservation_id
        FOR UPDATE;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20019, 'Payment failed: Reservation ID ' || p_reservation_id || ' does not exist.');
    END;

    -- 2. State validation: SUCCESS or FAILED requires PENDING reservation
    IF p_payment_status IN ('SUCCESS', 'FAILED') THEN
        IF v_res_status <> 'PENDING' THEN
            RAISE_APPLICATION_ERROR(-20020, 'Payment recording rejected: Reservation must be PENDING (current status: ' || 
                                    v_res_status || ').');
        END IF;
    END IF;

    -- 3. State validation: REFUND_SUCCESS requires CANCELLED reservation
    IF p_payment_status = 'REFUND_SUCCESS' THEN
        IF v_res_status <> 'CANCELLED' THEN
            RAISE_APPLICATION_ERROR(-20021, 'Refund recording rejected: Reservation must be CANCELLED (current status: ' || 
                                    v_res_status || ').');
        END IF;
    END IF;

    -- 4. Generate unique transaction reference code
    v_txn_ref := 'TXN' || LPAD(SEQ_TXN_REF.NEXTVAL, 12, '0');

    -- 5. Insert payment record into PAYMENT
    INSERT INTO PAYMENT (
        payment_id,
        reservation_id,
        amount,
        payment_method,
        payment_status,
        transaction_reference,
        payment_timestamp
    ) VALUES (
        SEQ_PAYMENT_ID.NEXTVAL,
        p_reservation_id,
        p_amount,
        p_payment_method,
        p_payment_status,
        v_txn_ref,
        SYSTIMESTAMP
    );

    -- NOTE: NO COMMIT here. Transaction boundary controlled by caller.
END P_RECORD_PAYMENT;
/

-- ----------------------------------------------------------------------------
-- 2. PROCEDURE: P_BOOK_TICKET
-- Orchestrates passenger ticket reservation: locking schedule, validating route,
-- seat availability, calculating fare, inserting PENDING reservation, and recording payment.
-- ----------------------------------------------------------------------------
PROMPT Creating Procedure: P_BOOK_TICKET...
CREATE OR REPLACE PROCEDURE P_BOOK_TICKET (
    p_passenger_id              IN  NUMBER,
    p_schedule_id               IN  NUMBER,
    p_source_station_id         IN  NUMBER,
    p_dest_station_id           IN  NUMBER,
    p_seat_id                   IN  NUMBER,
    p_payment_method            IN  VARCHAR2,
    p_simulated_payment_status  IN  VARCHAR2,
    p_reservation_id            OUT NUMBER,
    p_pnr                       OUT VARCHAR2,
    p_fare_amount               OUT NUMBER,
    p_booking_status            OUT VARCHAR2
)
IS
    v_dummy            NUMBER;
    v_train_id         TRAIN_SCHEDULE.train_id%TYPE;
    v_schedule_status  TRAIN_SCHEDULE.schedule_status%TYPE;
    v_coach_class      SEAT.coach_class%TYPE;
    v_src_seq          TRAIN_STOP.stop_sequence%TYPE;
    v_dest_seq         TRAIN_STOP.stop_sequence%TYPE;
    v_active_count     NUMBER;
    v_fare             NUMBER;
    v_res_id           NUMBER;
    v_pnr              VARCHAR2(15);
    v_final_status     VARCHAR2(20);
BEGIN
    -- 1. Validate passenger exists
    BEGIN
        SELECT 1 INTO v_dummy FROM PASSENGER WHERE passenger_id = p_passenger_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20010, 'Booking rejected: Passenger ID ' || p_passenger_id || ' does not exist.');
    END;

    -- 2. Lock schedule and validate existence and status
    BEGIN
        SELECT train_id, schedule_status
        INTO v_train_id, v_schedule_status
        FROM TRAIN_SCHEDULE
        WHERE schedule_id = p_schedule_id
        FOR UPDATE;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20011, 'Booking rejected: Schedule ID ' || p_schedule_id || ' does not exist.');
    END;

    -- 3. Validate schedule is SCHEDULED
    IF v_schedule_status <> 'SCHEDULED' THEN
        RAISE_APPLICATION_ERROR(-20011, 'Booking rejected: Schedule status is ' || v_schedule_status || 
                                '; only SCHEDULED runs can be booked.');
    END IF;

    -- 4. Validate seat belongs to this train
    BEGIN
        SELECT coach_class
        INTO v_coach_class
        FROM SEAT
        WHERE seat_id = p_seat_id
          AND train_id = v_train_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20012, 'Booking rejected: Seat ID ' || p_seat_id || 
                                    ' does not belong to train assigned to this schedule.');
    END;

    -- 5. Validate source & destination stations belong to train route and get stop sequences
    BEGIN
        SELECT stop_sequence INTO v_src_seq
        FROM TRAIN_STOP
        WHERE train_id = v_train_id AND station_id = p_source_station_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20013, 'Booking rejected: Source station does not belong to the train route.');
    END;

    BEGIN
        SELECT stop_sequence INTO v_dest_seq
        FROM TRAIN_STOP
        WHERE train_id = v_train_id AND station_id = p_dest_station_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20013, 'Booking rejected: Destination station does not belong to the train route.');
    END;

    -- 6. Validate travel direction: source stop_sequence < destination stop_sequence
    IF v_src_seq >= v_dest_seq THEN
        RAISE_APPLICATION_ERROR(-20013, 'Booking rejected: Source stop sequence (' || v_src_seq || 
                                ') must precede destination sequence (' || v_dest_seq || ').');
    END IF;

    -- 7. Check seat is not currently held in an active (PENDING or CONFIRMED) reservation
    SELECT COUNT(*)
    INTO v_active_count
    FROM RESERVATION
    WHERE schedule_id = p_schedule_id
      AND seat_id = p_seat_id
      AND booking_status IN ('PENDING', 'CONFIRMED');

    IF v_active_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20014, 'Booking rejected: Seat ID ' || p_seat_id || 
                                ' is already actively reserved on schedule ID ' || p_schedule_id || '.');
    END IF;

    -- 8. Calculate fare using business rule function
    v_fare := F_CALCULATE_FARE(p_schedule_id, p_source_station_id, p_dest_station_id, p_seat_id);

    -- 9. Generate surrogate reservation ID and unique PNR
    v_res_id := SEQ_RESERVATION_ID.NEXTVAL;
    v_pnr    := 'PNR' || LPAD(SEQ_PNR.NEXTVAL, 10, '0');

    -- 10. Insert reservation in PENDING status
    INSERT INTO RESERVATION (
        reservation_id,
        pnr,
        passenger_id,
        schedule_id,
        seat_id,
        source_station_id,
        destination_station_id,
        booking_timestamp,
        booking_status,
        fare_amount
    ) VALUES (
        v_res_id,
        v_pnr,
        p_passenger_id,
        p_schedule_id,
        p_seat_id,
        p_source_station_id,
        p_dest_station_id,
        SYSTIMESTAMP,
        'PENDING',
        v_fare
    );

    -- 11. Record payment with simulated status (SUCCESS / FAILED)
    P_RECORD_PAYMENT(v_res_id, v_fare, p_payment_method, p_simulated_payment_status);

    -- 12. Re-read booking_status (TRG_SYNC_RESERVATION_ON_PAYMENT may have transitioned it to CONFIRMED)
    SELECT booking_status
    INTO v_final_status
    FROM RESERVATION
    WHERE reservation_id = v_res_id;

    -- 13. Populate OUT parameters
    p_reservation_id := v_res_id;
    p_pnr            := v_pnr;
    p_fare_amount    := v_fare;
    p_booking_status := v_final_status;

    -- NOTE: NO COMMIT here. Transaction boundary controlled by caller.
END P_BOOK_TICKET;
/

-- ----------------------------------------------------------------------------
-- 3. PROCEDURE: P_CANCEL_RESERVATION
-- Cancels an existing CONFIRMED or PENDING reservation, releases the seat hold,
-- and issues a full refund if payments were successfully collected.
-- ----------------------------------------------------------------------------
PROMPT Creating Procedure: P_CANCEL_RESERVATION...
CREATE OR REPLACE PROCEDURE P_CANCEL_RESERVATION (
    p_pnr            IN  VARCHAR2,
    p_result         OUT VARCHAR2,
    p_booking_status OUT VARCHAR2,
    p_refund_amount  OUT NUMBER
)
IS
    v_res_id         RESERVATION.reservation_id%TYPE;
    v_current_status RESERVATION.booking_status%TYPE;
    v_net_paid       NUMBER;
BEGIN
    -- 1. Locate and lock reservation by PNR
    BEGIN
        SELECT reservation_id, booking_status
        INTO v_res_id, v_current_status
        FROM RESERVATION
        WHERE pnr = p_pnr
        FOR UPDATE;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20030, 'Cancellation rejected: PNR ' || p_pnr || ' does not exist.');
    END;

    -- 2. Verify eligibility: must be CONFIRMED or PENDING
    IF v_current_status NOT IN ('CONFIRMED', 'PENDING') THEN
        RAISE_APPLICATION_ERROR(-20030, 'Cancellation rejected: Reservation is already ' || v_current_status || 
                                '; only CONFIRMED or PENDING bookings can be cancelled.');
    END IF;

    -- 3. Calculate net paid amount eligible for refund
    v_net_paid := F_NET_PAID_AMOUNT(v_res_id);

    -- 4. Transition reservation status to CANCELLED
    UPDATE RESERVATION
    SET booking_status = 'CANCELLED'
    WHERE reservation_id = v_res_id;

    -- 5. If successful payment exists, log REFUND_SUCCESS transaction
    IF v_net_paid > 0 THEN
        P_RECORD_PAYMENT(v_res_id, v_net_paid, 'REFUND', 'REFUND_SUCCESS');
        p_refund_amount := v_net_paid;
        p_result := 'SUCCESS: Reservation ' || p_pnr || ' cancelled and refund of INR ' || v_net_paid || ' processed.';
    ELSE
        p_refund_amount := 0;
        p_result := 'SUCCESS: Reservation ' || p_pnr || ' cancelled. No payment was captured; refund amount is 0.';
    END IF;

    p_booking_status := 'CANCELLED';

    -- NOTE: NO COMMIT here. Transaction boundary controlled by caller.
END P_CANCEL_RESERVATION;
/

-- ----------------------------------------------------------------------------
-- 4. PROCEDURE: P_EXPIRE_STALE_RESERVATIONS
-- Sweeps all PENDING reservations exceeding the retention threshold (p_max_age_minutes)
-- and marks them EXPIRED, releasing the seats for new bookings.
-- ----------------------------------------------------------------------------
PROMPT Creating Procedure: P_EXPIRE_STALE_RESERVATIONS...
CREATE OR REPLACE PROCEDURE P_EXPIRE_STALE_RESERVATIONS (
    p_max_age_minutes IN  NUMBER,
    p_expired_count   OUT NUMBER
)
IS
    CURSOR c_stale IS
        SELECT reservation_id, pnr
        FROM RESERVATION
        WHERE booking_status = 'PENDING'
          AND booking_timestamp < SYSTIMESTAMP - NUMTODSINTERVAL(p_max_age_minutes, 'MINUTE')
        FOR UPDATE;

    v_rec   c_stale%ROWTYPE;
    v_count NUMBER := 0;
BEGIN
    OPEN c_stale;
    LOOP
        FETCH c_stale INTO v_rec;
        EXIT WHEN c_stale%NOTFOUND;

        UPDATE RESERVATION
        SET booking_status = 'EXPIRED'
        WHERE CURRENT OF c_stale;

        v_count := v_count + 1;
    END LOOP;
    CLOSE c_stale;

    p_expired_count := v_count;

    -- NOTE: NO COMMIT here. Transaction boundary controlled by caller.
END P_EXPIRE_STALE_RESERVATIONS;
/

PROMPT ============================================================================
PROMPT Procedures Created Successfully.
PROMPT ============================================================================
