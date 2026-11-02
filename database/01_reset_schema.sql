-- ============================================================================
-- SCRIPT: 01_reset_schema.sql
-- PROJECT: Railway Reservation System (Terminus DBMS)
-- PURPOSE: Safely drop all existing schema objects (views, triggers, procedures,
--          functions, indexes, sequences, and tables) in reverse dependency order.
-- SYNTAX: Oracle SQL / PL/SQL
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

PROMPT ============================================================================
PROMPT Resetting Schema: Dropping Railway Reservation System Objects
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP VIEWS
-- ----------------------------------------------------------------------------
PROMPT Dropping Views...
DECLARE
    TYPE obj_arr IS TABLE OF VARCHAR2(100);
    v_views obj_arr := obj_arr(
        'V_SCHEDULE_AVAILABILITY',
        'V_PAYMENT_HISTORY',
        'V_RESERVATION_DETAILS',
        'V_TRAIN_ROUTE'
    );
BEGIN
    FOR i IN 1..v_views.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP VIEW ' || v_views(i);
            DBMS_OUTPUT.PUT_LINE('  [DROPPED] View: ' || v_views(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = -942 THEN
                    DBMS_OUTPUT.PUT_LINE('  [SKIP] View does not exist: ' || v_views(i));
                ELSE
                    DBMS_OUTPUT.PUT_LINE('  [ERROR] View ' || v_views(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

-- ----------------------------------------------------------------------------
-- 2. DROP TRIGGERS
-- ----------------------------------------------------------------------------
PROMPT Dropping Triggers...
DECLARE
    TYPE obj_arr IS TABLE OF VARCHAR2(100);
    v_triggers obj_arr := obj_arr(
        'TRG_SYNC_RESERVATION_ON_PAYMENT',
        'TRG_VALIDATE_RESERVATION'
    );
BEGIN
    FOR i IN 1..v_triggers.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP TRIGGER ' || v_triggers(i);
            DBMS_OUTPUT.PUT_LINE('  [DROPPED] Trigger: ' || v_triggers(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = -4080 THEN
                    DBMS_OUTPUT.PUT_LINE('  [SKIP] Trigger does not exist: ' || v_triggers(i));
                ELSE
                    DBMS_OUTPUT.PUT_LINE('  [ERROR] Trigger ' || v_triggers(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

-- ----------------------------------------------------------------------------
-- 3. DROP PROCEDURES
-- ----------------------------------------------------------------------------
PROMPT Dropping Procedures...
DECLARE
    TYPE obj_arr IS TABLE OF VARCHAR2(100);
    v_procs obj_arr := obj_arr(
        'P_EXPIRE_STALE_RESERVATIONS',
        'P_CANCEL_RESERVATION',
        'P_RECORD_PAYMENT',
        'P_BOOK_TICKET'
    );
BEGIN
    FOR i IN 1..v_procs.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP PROCEDURE ' || v_procs(i);
            DBMS_OUTPUT.PUT_LINE('  [DROPPED] Procedure: ' || v_procs(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = -4043 THEN
                    DBMS_OUTPUT.PUT_LINE('  [SKIP] Procedure does not exist: ' || v_procs(i));
                ELSE
                    DBMS_OUTPUT.PUT_LINE('  [ERROR] Procedure ' || v_procs(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

-- ----------------------------------------------------------------------------
-- 4. DROP FUNCTIONS
-- ----------------------------------------------------------------------------
PROMPT Dropping Functions...
DECLARE
    TYPE obj_arr IS TABLE OF VARCHAR2(100);
    v_funcs obj_arr := obj_arr(
        'F_NET_PAID_AMOUNT',
        'F_AVAILABLE_SEAT_COUNT',
        'F_CALCULATE_FARE'
    );
BEGIN
    FOR i IN 1..v_funcs.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP FUNCTION ' || v_funcs(i);
            DBMS_OUTPUT.PUT_LINE('  [DROPPED] Function: ' || v_funcs(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = -4043 THEN
                    DBMS_OUTPUT.PUT_LINE('  [SKIP] Function does not exist: ' || v_funcs(i));
                ELSE
                    DBMS_OUTPUT.PUT_LINE('  [ERROR] Function ' || v_funcs(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

-- ----------------------------------------------------------------------------
-- 5. DROP SEQUENCES
-- ----------------------------------------------------------------------------
PROMPT Dropping Sequences...
DECLARE
    TYPE obj_arr IS TABLE OF VARCHAR2(100);
    v_seqs obj_arr := obj_arr(
        'SEQ_TXN_REF',
        'SEQ_PNR',
        'SEQ_PAYMENT_ID',
        'SEQ_RESERVATION_ID',
        'SEQ_SEAT_ID',
        'SEQ_SCHEDULE_ID',
        'SEQ_TRAIN_ID',
        'SEQ_STATION_ID',
        'SEQ_PASSENGER_ID'
    );
BEGIN
    FOR i IN 1..v_seqs.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP SEQUENCE ' || v_seqs(i);
            DBMS_OUTPUT.PUT_LINE('  [DROPPED] Sequence: ' || v_seqs(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = -2289 THEN
                    DBMS_OUTPUT.PUT_LINE('  [SKIP] Sequence does not exist: ' || v_seqs(i));
                ELSE
                    DBMS_OUTPUT.PUT_LINE('  [ERROR] Sequence ' || v_seqs(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

-- ----------------------------------------------------------------------------
-- 6. DROP TABLES (Reverse Dependency Order with CASCADE CONSTRAINTS PURGE)
-- ----------------------------------------------------------------------------
PROMPT Dropping Tables...
DECLARE
    TYPE obj_arr IS TABLE OF VARCHAR2(100);
    v_tables obj_arr := obj_arr(
        'PAYMENT',
        'RESERVATION',
        'SEAT',
        'TRAIN_SCHEDULE',
        'TRAIN_STOP',
        'TRAIN',
        'STATION',
        'PASSENGER'
    );
BEGIN
    FOR i IN 1..v_tables.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP TABLE ' || v_tables(i) || ' CASCADE CONSTRAINTS PURGE';
            DBMS_OUTPUT.PUT_LINE('  [DROPPED] Table: ' || v_tables(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = -942 THEN
                    DBMS_OUTPUT.PUT_LINE('  [SKIP] Table does not exist: ' || v_tables(i));
                ELSE
                    DBMS_OUTPUT.PUT_LINE('  [ERROR] Table ' || v_tables(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

PROMPT ============================================================================
PROMPT Schema Reset Complete.
PROMPT ============================================================================
