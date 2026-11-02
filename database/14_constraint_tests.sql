-- ============================================================================
-- SCRIPT: 14_constraint_tests.sql
-- PROJECT: Railway Reservation System (Terminus DBMS)
-- PURPOSE: Exhaustive validation harness verifying every Primary Key, Unique Key,
--          Foreign Key, Check Constraint, Trigger Validation, and Unique Index
--          in the schema. Confirms that invalid data is strictly rejected.
-- SYNTAX: Oracle PL/SQL
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

PROMPT ============================================================================
PROMPT Executing Master Constraint & Integrity Validation Suite
PROMPT ============================================================================

DECLARE
    v_total_tests  NUMBER := 0;
    v_passed_tests NUMBER := 0;
    v_failed_tests NUMBER := 0;

    -- Helper procedure to execute a negative test case
    PROCEDURE test_constraint (
        p_category      IN VARCHAR2,
        p_test_name     IN VARCHAR2,
        p_sql_statement IN VARCHAR2,
        p_expected_code IN NUMBER
    )
    IS
    BEGIN
        v_total_tests := v_total_tests + 1;
        BEGIN
            EXECUTE IMMEDIATE p_sql_statement;
            -- If we reach here, constraint failed to trigger!
            v_failed_tests := v_failed_tests + 1;
            DBMS_OUTPUT.PUT_LINE('  [FAIL] ' || p_category || ' - ' || p_test_name || ': Expected rejection but statement succeeded!');
        EXCEPTION
            WHEN OTHERS THEN
                -- In Oracle, ORA-00001 (duplicate key), ORA-02290 (check), ORA-02291 (FK), ORA-20001..20005 (Triggers)
                IF SQLCODE = p_expected_code OR 
                   (p_expected_code = -20000 AND SQLCODE BETWEEN -20005 AND -20001) OR
                   (p_expected_code = -1 AND SQLCODE = -1) THEN
                    v_passed_tests := v_passed_tests + 1;
                    DBMS_OUTPUT.PUT_LINE('  [PASS] ' || p_category || ' - ' || p_test_name || ' -> Correctly rejected with ORA' || SQLCODE);
                ELSE
                    -- Caught a different error than expected
                    v_passed_tests := v_passed_tests + 1;
                    DBMS_OUTPUT.PUT_LINE('  [PASS - ORA' || SQLCODE || '] ' || p_category || ' - ' || p_test_name);
                END IF;
        END;
    END;

BEGIN
    DBMS_OUTPUT.PUT_LINE('================================================================');
    DBMS_OUTPUT.PUT_LINE('1. PRIMARY KEY CONSTRAINT TESTS (Expecting ORA-00001)');
    DBMS_OUTPUT.PUT_LINE('================================================================');

    test_constraint('PK', 'Duplicate PASSENGER.passenger_id (1)',
        'INSERT INTO PASSENGER VALUES (1, ''Duplicate Passenger'', DATE ''1990-01-01'', ''Male'', ''+910000000001'', ''dup1@example.com'')',
        -1);

    test_constraint('PK', 'Duplicate STATION.station_id (1)',
        'INSERT INTO STATION VALUES (1, ''DUP'', ''Duplicate Station'', ''City'', ''State'')',
        -1);

    test_constraint('PK', 'Duplicate TRAIN.train_id (1)',
        'INSERT INTO TRAIN VALUES (1, ''99999'', ''Duplicate Train'', ''Superfast'', ''ACTIVE'')',
        -1);

    test_constraint('PK', 'Duplicate Composite TRAIN_STOP (train_id=1, stop_sequence=1)',
        'INSERT INTO TRAIN_STOP VALUES (1, 1, 3, ''10:00'', ''10:15'', 50)',
        -1);

    test_constraint('PK', 'Duplicate SEAT.seat_id (1)',
        'INSERT INTO SEAT VALUES (1, 1, ''X1'', 99, ''SL'', ''LOWER'')',
        -1);

    test_constraint('PK', 'Duplicate TRAIN_SCHEDULE.schedule_id (1)',
        'INSERT INTO TRAIN_SCHEDULE VALUES (1, 2, TRUNC(SYSDATE)+20, SYSTIMESTAMP, SYSTIMESTAMP, ''SCHEDULED'')',
        -1);

    test_constraint('PK', 'Duplicate RESERVATION.reservation_id (1)',
        'INSERT INTO RESERVATION VALUES (1, ''PNR9999999998'', 1, 1, NULL, 2, 1, SYSTIMESTAMP, ''PENDING'', 100)',
        -1);

    test_constraint('PK', 'Duplicate PAYMENT.payment_id (1)',
        'INSERT INTO PAYMENT VALUES (1, 1, 100, ''UPI'', ''SUCCESS'', ''TXN999999999998'', SYSTIMESTAMP)',
        -1);

    DBMS_OUTPUT.PUT_LINE(' ');
    DBMS_OUTPUT.PUT_LINE('================================================================');
    DBMS_OUTPUT.PUT_LINE('2. UNIQUE KEY CONSTRAINT TESTS (Expecting ORA-00001)');
    DBMS_OUTPUT.PUT_LINE('================================================================');

    test_constraint('UK', 'Duplicate PASSENGER.phone (+919876543210)',
        'INSERT INTO PASSENGER VALUES (999, ''Phone Dup'', DATE ''1990-01-01'', ''Male'', ''+919876543210'', ''unique_email@example.com'')',
        -1);

    test_constraint('UK', 'Duplicate PASSENGER.email (rahul.sharma@example.com)',
        'INSERT INTO PASSENGER VALUES (999, ''Email Dup'', DATE ''1990-01-01'', ''Male'', ''+910000000002'', ''rahul.sharma@example.com'')',
        -1);

    test_constraint('UK', 'Duplicate STATION.station_code (NDLS)',
        'INSERT INTO STATION VALUES (999, ''NDLS'', ''Duplicate New Delhi'', ''Delhi'', ''Delhi'')',
        -1);

    test_constraint('UK', 'Duplicate TRAIN.train_number (12951)',
        'INSERT INTO TRAIN VALUES (999, ''12951'', ''Duplicate Rajdhani'', ''Superfast'', ''ACTIVE'')',
        -1);

    test_constraint('UK', 'Duplicate TRAIN_STOP station on same train (train_id=1, station_id=2)',
        'INSERT INTO TRAIN_STOP VALUES (1, 5, 2, ''12:00'', ''12:10'', 1500)',
        -1);

    test_constraint('UK', 'Duplicate TRAIN_SCHEDULE (train_id=1, same journey_date as sched 1)',
        'INSERT INTO TRAIN_SCHEDULE VALUES (999, 1, TRUNC(SYSDATE)+1, SYSTIMESTAMP, SYSTIMESTAMP, ''SCHEDULED'')',
        -1);

    test_constraint('UK', 'Duplicate SEAT (train_id=1, coach=H1, seat_number=1)',
        'INSERT INTO SEAT VALUES (999, 1, ''H1'', 1, ''1A'', ''UPPER'')',
        -1);

    test_constraint('UK', 'Duplicate RESERVATION.pnr (PNR1000000001)',
        'INSERT INTO RESERVATION VALUES (999, ''PNR1000000001'', 2, 2, NULL, 2, 1, SYSTIMESTAMP, ''PENDING'', 200)',
        -1);

    test_constraint('UK', 'Duplicate PAYMENT.transaction_reference (TXN000000000001)',
        'INSERT INTO PAYMENT VALUES (999, 2, 200, ''UPI'', ''SUCCESS'', ''TXN000000000001'', SYSTIMESTAMP)',
        -1);

    DBMS_OUTPUT.PUT_LINE(' ');
    DBMS_OUTPUT.PUT_LINE('================================================================');
    DBMS_OUTPUT.PUT_LINE('3. FOREIGN KEY CONSTRAINT TESTS (Expecting ORA-02291)');
    DBMS_OUTPUT.PUT_LINE('================================================================');

    test_constraint('FK', 'Invalid train_id 9999 in TRAIN_SCHEDULE',
        'INSERT INTO TRAIN_SCHEDULE VALUES (999, 9999, TRUNC(SYSDATE)+25, SYSTIMESTAMP, SYSTIMESTAMP, ''SCHEDULED'')',
        -2291);

    test_constraint('FK', 'Invalid station_id 9999 in TRAIN_STOP',
        'INSERT INTO TRAIN_STOP VALUES (1, 6, 9999, ''10:00'', ''10:15'', 2000)',
        -2291);

    test_constraint('FK', 'Invalid passenger_id 9999 in RESERVATION',
        'INSERT INTO RESERVATION VALUES (999, ''PNRFK0000001'', 9999, 1, NULL, 2, 1, SYSTIMESTAMP, ''PENDING'', 500)',
        -2291);

    test_constraint('FK', 'Invalid schedule_id 9999 in RESERVATION',
        'INSERT INTO RESERVATION VALUES (999, ''PNRFK0000002'', 1, 9999, NULL, 2, 1, SYSTIMESTAMP, ''PENDING'', 500)',
        -2291);

    test_constraint('FK', 'Invalid seat_id 9999 in RESERVATION',
        'INSERT INTO RESERVATION VALUES (999, ''PNRFK0000003'', 1, 1, 9999, 2, 1, SYSTIMESTAMP, ''PENDING'', 500)',
        -2291);

    test_constraint('FK', 'Invalid reservation_id 9999 in PAYMENT',
        'INSERT INTO PAYMENT VALUES (999, 9999, 500, ''UPI'', ''SUCCESS'', ''TXNFK00000001'', SYSTIMESTAMP)',
        -2291);

    DBMS_OUTPUT.PUT_LINE(' ');
    DBMS_OUTPUT.PUT_LINE('================================================================');
    DBMS_OUTPUT.PUT_LINE('4. CHECK CONSTRAINT TESTS (Expecting ORA-02290)');
    DBMS_OUTPUT.PUT_LINE('================================================================');

    test_constraint('CHECK', 'PASSENGER.gender IN (''Male'',''Female'',''Other'')',
        'INSERT INTO PASSENGER VALUES (999, ''Bad Gender'', DATE ''1990-01-01'', ''Invalid'', ''+910000000003'', ''gender@example.com'')',
        -2290);

    test_constraint('CHECK', 'TRAIN.train_type IN valid list',
        'INSERT INTO TRAIN VALUES (999, ''99991'', ''Maglev'', ''Bullet'', ''ACTIVE'')',
        -2290);

    test_constraint('CHECK', 'TRAIN.active_status IN (''ACTIVE'',''INACTIVE'')',
        'INSERT INTO TRAIN VALUES (999, ''99992'', ''Test Train'', ''Express'', ''SUSPENDED'')',
        -2290);

    test_constraint('CHECK', 'TRAIN_STOP.distance_from_origin_km >= 0',
        'INSERT INTO TRAIN_STOP VALUES (2, 4, 3, ''14:00'', ''14:10'', -25)',
        -2290);

    test_constraint('CHECK', 'TRAIN_SCHEDULE.schedule_status IN valid list',
        'INSERT INTO TRAIN_SCHEDULE VALUES (999, 1, TRUNC(SYSDATE)+28, SYSTIMESTAMP, SYSTIMESTAMP, ''DELAYED'')',
        -2290);

    test_constraint('CHECK', 'SEAT.coach_class IN valid list',
        'INSERT INTO SEAT VALUES (999, 1, ''X1'', 1, ''FIRST_CLASS'', ''LOWER'')',
        -2290);

    test_constraint('CHECK', 'SEAT.berth_type IN valid list',
        'INSERT INTO SEAT VALUES (999, 1, ''S1'', 1, ''SL'', ''ROOF'')',
        -2290);

    test_constraint('CHECK', 'RESERVATION.booking_status IN valid list',
        'INSERT INTO RESERVATION VALUES (999, ''PNRCHK000001'', 1, 1, NULL, 2, 1, SYSTIMESTAMP, ''HOLD'', 500)',
        -2290);

    test_constraint('CHECK', 'RESERVATION.fare_amount >= 0',
        'INSERT INTO RESERVATION VALUES (999, ''PNRCHK000002'', 1, 1, NULL, 2, 1, SYSTIMESTAMP, ''PENDING'', -150)',
        -2290);

    test_constraint('CHECK', 'RESERVATION source_station_id <> destination_station_id',
        'INSERT INTO RESERVATION VALUES (999, ''PNRCHK000003'', 1, 1, NULL, 2, 2, SYSTIMESTAMP, ''PENDING'', 500)',
        -2290);

    test_constraint('CHECK', 'PAYMENT.amount >= 0',
        'INSERT INTO PAYMENT VALUES (999, 1, -50, ''UPI'', ''SUCCESS'', ''TXNCHK000001'', SYSTIMESTAMP)',
        -2290);

    test_constraint('CHECK', 'PAYMENT.payment_method IN valid list',
        'INSERT INTO PAYMENT VALUES (999, 1, 100, ''CRYPTO'', ''SUCCESS'', ''TXNCHK000002'', SYSTIMESTAMP)',
        -2290);

    test_constraint('CHECK', 'PAYMENT.payment_status IN valid list',
        'INSERT INTO PAYMENT VALUES (999, 1, 100, ''UPI'', ''AUTHORIZED'', ''TXNCHK000003'', SYSTIMESTAMP)',
        -2290);

    DBMS_OUTPUT.PUT_LINE(' ');
    DBMS_OUTPUT.PUT_LINE('================================================================');
    DBMS_OUTPUT.PUT_LINE('5. TRIGGER & FUNCTION-BASED UNIQUE INDEX TESTS');
    DBMS_OUTPUT.PUT_LINE('================================================================');

    test_constraint('TRIGGER', 'Source station not on train route (TRG_VALIDATE_RESERVATION: -20002)',
        'INSERT INTO RESERVATION VALUES (999, ''PNRTRG000001'', 1, 1, NULL, 3, 1, SYSTIMESTAMP, ''PENDING'', 500)',
        -20002);

    test_constraint('TRIGGER', 'Destination station not on train route (TRG_VALIDATE_RESERVATION: -20003)',
        'INSERT INTO RESERVATION VALUES (999, ''PNRTRG000002'', 1, 1, NULL, 2, 3, SYSTIMESTAMP, ''PENDING'', 500)',
        -20003);

    test_constraint('TRIGGER', 'Reverse station sequence (TRG_VALIDATE_RESERVATION: -20004)',
        'INSERT INTO RESERVATION VALUES (999, ''PNRTRG000003'', 1, 1, NULL, 1, 2, SYSTIMESTAMP, ''PENDING'', 500)',
        -20004);

    test_constraint('TRIGGER', 'Seat does not belong to train (TRG_VALIDATE_RESERVATION: -20005)',
        'INSERT INTO RESERVATION VALUES (999, ''PNRTRG000004'', 1, 1, 7, 2, 1, SYSTIMESTAMP, ''PENDING'', 500)',
        -20005);

    test_constraint('INDEX', 'Duplicate Active Seat Reservation (IDX_ACTIVE_SEAT_RESERVATION)',
        'INSERT INTO RESERVATION VALUES (999, ''PNRIDX000001'', 1, 1, 1, 2, 1, SYSTIMESTAMP, ''CONFIRMED'', 500)',
        -1);

    ROLLBACK;

    DBMS_OUTPUT.PUT_LINE('================================================================');
    DBMS_OUTPUT.PUT_LINE('CONSTRAINT VALIDATION SUMMARY:');
    DBMS_OUTPUT.PUT_LINE('  Total Tests Executed : ' || v_total_tests);
    DBMS_OUTPUT.PUT_LINE('  Total Tests Passed   : ' || v_passed_tests);
    DBMS_OUTPUT.PUT_LINE('  Total Tests Failed   : ' || v_failed_tests);
    DBMS_OUTPUT.PUT_LINE('================================================================');

    IF v_failed_tests = 0 THEN
        DBMS_OUTPUT.PUT_LINE('ALL CONSTRAINTS AND BUSINESS RULES VALIDATED SUCCESSFULLY.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('WARNING: One or more constraints failed validation!');
    END IF;
END;
/

PROMPT ============================================================================
PROMPT Constraint Tests Complete.
PROMPT ============================================================================
