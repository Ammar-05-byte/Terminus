-- ============================================================================
-- SCRIPT: 07_create_triggers.sql
-- PROJECT: Railway Reservation System (Terminus DBMS)
-- PURPOSE: Create database triggers for business integrity validation and automated
--          lifecycle synchronization:
--          1. TRG_VALIDATE_RESERVATION - Route validity & seat ownership validation
--          2. TRG_SYNC_RESERVATION_ON_PAYMENT - Auto-transition PENDING to CONFIRMED on payment
-- SYNTAX: Oracle PL/SQL / Triggers
-- ============================================================================

PROMPT ============================================================================
PROMPT Creating Database Triggers
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: TRG_VALIDATE_RESERVATION
-- Fires BEFORE INSERT OR UPDATE ON RESERVATION.
-- Validates:
--   a) Source station belongs to train route (-20002)
--   b) Destination station belongs to train route (-20003)
--   c) Boarding sequence precedes deboarding sequence (-20004)
--   d) Allocated seat belongs to the schedule's assigned train (-20005)
-- Skips validation for CANCELLED or EXPIRED reservations.
-- ----------------------------------------------------------------------------
PROMPT Creating Trigger: TRG_VALIDATE_RESERVATION...
CREATE OR REPLACE TRIGGER TRG_VALIDATE_RESERVATION
BEFORE INSERT OR UPDATE ON RESERVATION
FOR EACH ROW
DECLARE
    v_train_id  TRAIN_SCHEDULE.train_id%TYPE;
    v_src_seq   TRAIN_STOP.stop_sequence%TYPE;
    v_dest_seq  TRAIN_STOP.stop_sequence%TYPE;
    v_dummy     NUMBER;
BEGIN
    -- Skip route validation if reservation is being cancelled or marked expired
    IF :NEW.booking_status IN ('CANCELLED', 'EXPIRED') THEN
        RETURN;
    END IF;

    -- 1. Identify train assigned to schedule
    BEGIN
        SELECT train_id
        INTO v_train_id
        FROM TRAIN_SCHEDULE
        WHERE schedule_id = :NEW.schedule_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20001, 'Invalid schedule_id: Train schedule does not exist.');
    END;

    -- 2. Validate source station exists in train route
    BEGIN
        SELECT stop_sequence
        INTO v_src_seq
        FROM TRAIN_STOP
        WHERE train_id = v_train_id
          AND station_id = :NEW.source_station_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20002, 'Source station does not belong to the train route.');
    END;

    -- 3. Validate destination station exists in train route
    BEGIN
        SELECT stop_sequence
        INTO v_dest_seq
        FROM TRAIN_STOP
        WHERE train_id = v_train_id
          AND station_id = :NEW.destination_station_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20003, 'Destination station does not belong to the train route.');
    END;

    -- 4. Validate source stop_sequence < destination stop_sequence
    IF v_src_seq >= v_dest_seq THEN
        RAISE_APPLICATION_ERROR(-20004, 'Source station sequence (' || v_src_seq || 
                                ') must precede destination station sequence (' || v_dest_seq || ').');
    END IF;

    -- 5. If seat_id is specified, validate that seat belongs to this train
    IF :NEW.seat_id IS NOT NULL THEN
        BEGIN
            SELECT 1
            INTO v_dummy
            FROM SEAT
            WHERE seat_id = :NEW.seat_id
              AND train_id = v_train_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20005, 'Seat does not belong to the scheduled train.');
        END IF;
    END IF;
END TRG_VALIDATE_RESERVATION;
/

-- ----------------------------------------------------------------------------
-- 2. TRIGGER: TRG_SYNC_RESERVATION_ON_PAYMENT
-- Fires AFTER INSERT ON PAYMENT.
-- Automatically transitions RESERVATION status from PENDING to CONFIRMED
-- upon successful settlement of payment.
-- ----------------------------------------------------------------------------
PROMPT Creating Trigger: TRG_SYNC_RESERVATION_ON_PAYMENT...
CREATE OR REPLACE TRIGGER TRG_SYNC_RESERVATION_ON_PAYMENT
AFTER INSERT ON PAYMENT
FOR EACH ROW
BEGIN
    IF :NEW.payment_status = 'SUCCESS' THEN
        UPDATE RESERVATION
        SET booking_status = 'CONFIRMED'
        WHERE reservation_id = :NEW.reservation_id
          AND booking_status = 'PENDING';
    END IF;
    -- FAILED payments: leave reservation in PENDING state (awaiting retry or expiry)
    -- REFUND_SUCCESS payments: reservation is already CANCELLED
END TRG_SYNC_RESERVATION_ON_PAYMENT;
/

PROMPT ============================================================================
PROMPT Triggers Created Successfully.
PROMPT ============================================================================
