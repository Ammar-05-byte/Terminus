-- ============================================================================
-- SCRIPT: 04_create_indexes.sql
-- PROJECT: Railway Reservation System (Terminus DBMS)
-- PURPOSE: Create performance B-tree indexes, foreign key lookup indexes,
--          and the critical function-based unique index for active seat reservations.
-- SYNTAX: Oracle SQL / DDL
-- ============================================================================

PROMPT ============================================================================
PROMPT Creating Performance and Integrity Indexes
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Performance and Foreign Key B-Tree Indexes
-- ----------------------------------------------------------------------------

-- Index on RESERVATION(passenger_id) for passenger booking history lookups
PROMPT Creating Index: IDX_RESERVATION_PASSENGER...
CREATE INDEX IDX_RESERVATION_PASSENGER ON RESERVATION(passenger_id);

-- Index on RESERVATION(schedule_id) for schedule-based seat and booking lookups
PROMPT Creating Index: IDX_RESERVATION_SCHEDULE...
CREATE INDEX IDX_RESERVATION_SCHEDULE ON RESERVATION(schedule_id);

-- Index on PAYMENT(reservation_id) for reservation payment reconciliation
PROMPT Creating Index: IDX_PAYMENT_RESERVATION...
CREATE INDEX IDX_PAYMENT_RESERVATION ON PAYMENT(reservation_id);

-- Index on TRAIN_STOP(station_id) for route searching between station pairs
PROMPT Creating Index: IDX_TRAIN_STOP_STATION...
CREATE INDEX IDX_TRAIN_STOP_STATION ON TRAIN_STOP(station_id);

-- Index on SEAT(train_id) for coach inventory lookups
PROMPT Creating Index: IDX_SEAT_TRAIN...
CREATE INDEX IDX_SEAT_TRAIN ON SEAT(train_id);

-- ----------------------------------------------------------------------------
-- 2. Unique / Lookup Indexes on Unique Key Columns
-- In Oracle, unique constraints (from 02_create_tables.sql) automatically generate
-- unique indexes with the constraint name. Here we ensure indexes are named exactly
-- as specified: IDX_RESERVATION_PNR, IDX_TRAIN_NUMBER, IDX_STATION_CODE, IDX_SCHEDULE_TRAIN_DATE.
-- ----------------------------------------------------------------------------

PROMPT Establishing Unique Lookup Indexes: IDX_RESERVATION_PNR, IDX_TRAIN_NUMBER, IDX_STATION_CODE, IDX_SCHEDULE_TRAIN_DATE...
BEGIN
    -- 1. IDX_RESERVATION_PNR
    BEGIN
        EXECUTE IMMEDIATE 'ALTER INDEX UQ_RESERVATION_PNR RENAME TO IDX_RESERVATION_PNR';
    EXCEPTION
        WHEN OTHERS THEN
            BEGIN
                EXECUTE IMMEDIATE 'CREATE INDEX IDX_RESERVATION_PNR ON RESERVATION(pnr)';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE IN (-1408, -955) THEN NULL; ELSE RAISE; END IF;
            END;
    END;

    -- 2. IDX_TRAIN_NUMBER
    BEGIN
        EXECUTE IMMEDIATE 'ALTER INDEX UQ_TRAIN_NUMBER RENAME TO IDX_TRAIN_NUMBER';
    EXCEPTION
        WHEN OTHERS THEN
            BEGIN
                EXECUTE IMMEDIATE 'CREATE INDEX IDX_TRAIN_NUMBER ON TRAIN(train_number)';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE IN (-1408, -955) THEN NULL; ELSE RAISE; END IF;
            END;
    END;

    -- 3. IDX_STATION_CODE
    BEGIN
        EXECUTE IMMEDIATE 'ALTER INDEX UQ_STATION_CODE RENAME TO IDX_STATION_CODE';
    EXCEPTION
        WHEN OTHERS THEN
            BEGIN
                EXECUTE IMMEDIATE 'CREATE INDEX IDX_STATION_CODE ON STATION(station_code)';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE IN (-1408, -955) THEN NULL; ELSE RAISE; END IF;
            END;
    END;

    -- 4. IDX_SCHEDULE_TRAIN_DATE
    BEGIN
        EXECUTE IMMEDIATE 'ALTER INDEX UQ_TRAIN_SCHEDULE RENAME TO IDX_SCHEDULE_TRAIN_DATE';
    EXCEPTION
        WHEN OTHERS THEN
            BEGIN
                EXECUTE IMMEDIATE 'CREATE INDEX IDX_SCHEDULE_TRAIN_DATE ON TRAIN_SCHEDULE(train_id, journey_date)';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE IN (-1408, -955) THEN NULL; ELSE RAISE; END IF;
            END;
    END;
END;
/

-- ----------------------------------------------------------------------------
-- 3. CRITICAL: Function-Based Unique Index for Active Seat Reservations
-- Prevents double-booking: a seat can only have ONE active (PENDING or CONFIRMED)
-- reservation per schedule. CANCELLED or EXPIRED reservations evaluate to NULL,
-- which Oracle ignores in composite unique indexes, allowing cancelled seats to
-- be immediately re-booked.
-- ----------------------------------------------------------------------------
PROMPT Creating Function-Based Unique Index: IDX_ACTIVE_SEAT_RESERVATION...
CREATE UNIQUE INDEX IDX_ACTIVE_SEAT_RESERVATION ON RESERVATION (
    CASE WHEN booking_status IN ('PENDING', 'CONFIRMED') THEN schedule_id END,
    CASE WHEN booking_status IN ('PENDING', 'CONFIRMED') THEN seat_id END
);

PROMPT ============================================================================
PROMPT Indexes Created Successfully.
PROMPT ============================================================================
