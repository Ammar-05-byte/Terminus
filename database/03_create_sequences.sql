-- ============================================================================
-- PURPOSE: Create database sequences for generating surrogate keys, unique PNRs,
--          and transaction reference identifiers.
-- ============================================================================

PROMPT ============================================================================
PROMPT Creating Sequences
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Sequence for PASSENGER.passenger_id
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_PASSENGER_ID...
CREATE SEQUENCE SEQ_PASSENGER_ID
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 2. Sequence for STATION.station_id
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_STATION_ID...
CREATE SEQUENCE SEQ_STATION_ID
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 3. Sequence for TRAIN.train_id
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_TRAIN_ID...
CREATE SEQUENCE SEQ_TRAIN_ID
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 4. Sequence for TRAIN_SCHEDULE.schedule_id
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_SCHEDULE_ID...
CREATE SEQUENCE SEQ_SCHEDULE_ID
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 5. Sequence for SEAT.seat_id
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_SEAT_ID...
CREATE SEQUENCE SEQ_SEAT_ID
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 6. Sequence for RESERVATION.reservation_id
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_RESERVATION_ID...
CREATE SEQUENCE SEQ_RESERVATION_ID
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 7. Sequence for PAYMENT.payment_id
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_PAYMENT_ID...
CREATE SEQUENCE SEQ_PAYMENT_ID
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 8. Sequence for RESERVATION.pnr (Starting at 10-digit base 1000000000)
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_PNR...
CREATE SEQUENCE SEQ_PNR
    START WITH 1000000000
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

-- ----------------------------------------------------------------------------
-- 9. Sequence for PAYMENT.transaction_reference
-- ----------------------------------------------------------------------------
PROMPT Creating Sequence: SEQ_TXN_REF...
CREATE SEQUENCE SEQ_TXN_REF
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCACHE
    NOCYCLE;

PROMPT ============================================================================
PROMPT Sequences Created Successfully.
PROMPT ============================================================================
