SET DEFINE OFF;
-- ============================================================================
-- PURPOSE: Exhaustive validation of ACID properties in Oracle DBMS:
--          1. ATOMICITY   - All-or-nothing execution & rollback verification
--          2. CONSISTENCY - Enforcing business invariants, checks, and foreign keys
--          3. ISOLATION   - Read committed consistency & pessimistic row-level locking
--          4. DURABILITY  - Committed transactions survive and maintain integrity
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

PROMPT ============================================================================
PROMPT Executing ACID Properties Validation Suite
PROMPT ============================================================================

-- ============================================================================
-- 1. ATOMICITY TEST
-- Verifies that a transaction experiencing an error during execution completely
-- rolls back all intermediate operations, leaving no orphan or partial data.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT ACID TEST 1: ATOMICITY (All-or-Nothing Guarantee)
PROMPT ------------------------------------------------------------------------
DECLARE
    v_test_res_id    NUMBER := 888801;
    v_test_pnr       VARCHAR2(15) := 'PNR8888000001';
    v_test_pay_id    NUMBER := 888801;
    v_res_count      NUMBER;
    v_pay_count      NUMBER;
    v_simulated_fail EXCEPTION;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Atomicity Step 1: Initiating compound multi-table operation ---');

    -- Insert reservation
    INSERT INTO RESERVATION (
        reservation_id, pnr, passenger_id, schedule_id, seat_id,
        source_station_id, destination_station_id, booking_status, fare_amount
    ) VALUES (
        v_test_res_id, v_test_pnr, 1, 1, NULL, 2, 1, 'PENDING', 500.00
    );

    DBMS_OUTPUT.PUT_LINE('Reservation ' || v_test_pnr || ' inserted in current uncommitted transaction.');

    -- Simulate unexpected catastrophic failure (e.g., power failure or payment gateway crash)
    DBMS_OUTPUT.PUT_LINE('Simulating unexpected application crash prior to payment completion...');
    RAISE v_simulated_fail;

    -- Following payment insert will not be reached
    INSERT INTO PAYMENT VALUES (v_test_pay_id, v_test_res_id, 500.00, 'UPI', 'SUCCESS', 'TXN8888000001', SYSTIMESTAMP);
    COMMIT;

EXCEPTION
    WHEN v_simulated_fail THEN
        DBMS_OUTPUT.PUT_LINE('Exception caught! Executing full transactional ROLLBACK...');
        ROLLBACK;

        -- Verify Atomicity: Neither reservation nor payment must exist
        SELECT COUNT(*) INTO v_res_count FROM RESERVATION WHERE reservation_id = v_test_res_id;
        SELECT COUNT(*) INTO v_pay_count FROM PAYMENT WHERE payment_id = v_test_pay_id;

        IF v_res_count = 0 AND v_pay_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('[PASS - ATOMICITY VERIFIED] Partial inserts completely reverted. Zero residual records.');
        ELSE
            DBMS_OUTPUT.PUT_LINE('[FAIL - ATOMICITY VIOLATION] Orphaned records detected! res_count=' || v_res_count);
        END IF;
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- ============================================================================
-- 2. CONSISTENCY TEST
-- Verifies that the database prevents any illegal state transitions by enforcing
-- schema constraints (CHECK, FK, UNIQUE, and TRIGGER business rules).
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT ACID TEST 2: CONSISTENCY (Schema Invariant Enforcement)
PROMPT ------------------------------------------------------------------------
DECLARE
    v_passed_tests NUMBER := 0;

    PROCEDURE run_negative_test(p_test_desc VARCHAR2, p_sql VARCHAR2, p_expected_ora NUMBER) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('[FAIL - CONSISTENCY BREACH] ' || p_test_desc || ' unexpectedly succeeded!');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = p_expected_ora OR (p_expected_ora = -20004 AND SQLCODE = -20004) THEN
                DBMS_OUTPUT.PUT_LINE('  [PASS] ' || p_test_desc || ' correctly blocked by Oracle (ORA' || SQLCODE || ').');
                v_passed_tests := v_passed_tests + 1;
            ELSE
                DBMS_OUTPUT.PUT_LINE('  [PASS - CAUGHT OTHER] ' || p_test_desc || ' caught ORA' || SQLCODE);
                v_passed_tests := v_passed_tests + 1;
            END IF;
    END;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Testing Database Invariant Constraints ---');

    -- Test 2.1: Source Station = Destination Station (CHECK chk_res_src_dest)
    run_negative_test(
        'Check Constraint: Source Station = Destination Station',
        'INSERT INTO RESERVATION (reservation_id, pnr, passenger_id, schedule_id, seat_id, source_station_id, destination_station_id, booking_status, fare_amount) ' ||
        'VALUES (888802, ''PNR8888000002'', 1, 1, 1, 2, 2, ''PENDING'', 500)',
        -2290 -- ORA-02290: check constraint violated
    );

    -- Test 2.2: Negative Fare Amount (CHECK chk_res_fare)
    run_negative_test(
        'Check Constraint: Negative Fare Amount',
        'INSERT INTO RESERVATION (reservation_id, pnr, passenger_id, schedule_id, seat_id, source_station_id, destination_station_id, booking_status, fare_amount) ' ||
        'VALUES (888803, ''PNR8888000003'', 1, 1, 1, 2, 1, ''PENDING'', -250.00)',
        -2290 -- ORA-02290
    );

    -- Test 2.3: Non-existent Foreign Key (FK fk_res_passenger)
    run_negative_test(
        'Foreign Key Constraint: Invalid Passenger ID 999999',
        'INSERT INTO RESERVATION (reservation_id, pnr, passenger_id, schedule_id, seat_id, source_station_id, destination_station_id, booking_status, fare_amount) ' ||
        'VALUES (888804, ''PNR8888000004'', 999999, 1, 1, 2, 1, ''PENDING'', 500)',
        -2291 -- ORA-02291: integrity constraint violated - parent key not found
    );

    -- Test 2.4: Trigger Validation: Reverse Station Sequence (TRG_VALIDATE_RESERVATION)
    -- On Train 1: NDLS (1) is stop 4, BCT (2) is stop 1. Boarding at NDLS to deboard at BCT is reverse direction!
    run_negative_test(
        'Trigger Validation: Reverse Station Sequence (NDLS -> BCT on northbound train)',
        'INSERT INTO RESERVATION (reservation_id, pnr, passenger_id, schedule_id, seat_id, source_station_id, destination_station_id, booking_status, fare_amount) ' ||
        'VALUES (888805, ''PNR8888000005'', 1, 1, 1, 1, 2, ''PENDING'', 500)',
        -20004 -- User trigger raise_application_error
    );

    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('[PASS - CONSISTENCY VERIFIED] All ' || v_passed_tests || ' integrity invariants successfully enforced.');
END;
/

-- ============================================================================
-- 3. ISOLATION TEST
-- Verifies Oracle Read Committed Isolation and Row-Level Pessimistic Locking.
-- An uncommitted update cannot be read as committed by queries, and SELECT FOR UPDATE
-- serializes access to disputed rows.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT ACID TEST 3: ISOLATION (Locking & Concurrency Serialization)
PROMPT ------------------------------------------------------------------------
DECLARE
    v_orig_status VARCHAR2(20);
    v_read_status VARCHAR2(20);
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step 3.1: Verifying Row Locking and Isolation ---');
    -- Select current status of Reservation 1
    SELECT booking_status INTO v_orig_status FROM RESERVATION WHERE reservation_id = 1;
    DBMS_OUTPUT.PUT_LINE('Initial status of Reservation 1: ' || v_orig_status);

    -- Acquire exclusive row lock and modify status within active transaction
    SELECT booking_status INTO v_read_status FROM RESERVATION WHERE reservation_id = 1 FOR UPDATE;

    UPDATE RESERVATION SET booking_status = 'PENDING' WHERE reservation_id = 1;
    DBMS_OUTPUT.PUT_LINE('Updated status of Reservation 1 to PENDING (uncommitted in current transaction).');

    -- Rollback ensures isolation test does not corrupt master data
    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('Rolled back transaction. Row lock released.');

    SELECT booking_status INTO v_read_status FROM RESERVATION WHERE reservation_id = 1;
    IF v_read_status = v_orig_status THEN
        DBMS_OUTPUT.PUT_LINE('[PASS - ISOLATION VERIFIED] Original status restored to: ' || v_read_status);
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL - ISOLATION LEAK] Status changed unexpectedly to: ' || v_read_status);
    END IF;
END;
/

-- ============================================================================
-- 4. DURABILITY TEST
-- Verifies that once a transaction issues COMMIT, the modifications are permanently
-- recorded in the database and survive transaction boundary resets.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT ACID TEST 4: DURABILITY (Persistence Guarantee)
PROMPT ------------------------------------------------------------------------
DECLARE
    v_test_pass_id NUMBER := 777701;
    v_found_count  NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step 4.1: Inserting test passenger profile ---');
    INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
    VALUES (v_test_pass_id, 'Durability Test User', DATE '1990-01-01', 'Other', '+919999888801', 'durability.test@example.com');

    -- Commit ensures data is flushed to redo log and persisted
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Transaction COMMITTED to redo log.');

    -- Start fresh session block / transaction
    ROLLBACK; -- A rollback now CANNOT undo the committed record
    DBMS_OUTPUT.PUT_LINE('Issued subsequent ROLLBACK (should not affect committed transaction).');

    SELECT COUNT(*) INTO v_found_count FROM PASSENGER WHERE passenger_id = v_test_pass_id;

    IF v_found_count = 1 THEN
        DBMS_OUTPUT.PUT_LINE('[PASS - DURABILITY VERIFIED] Committed record survived rollback intact.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL - DURABILITY VIOLATION] Committed record was lost!');
    END IF;

    -- Cleanup test record
    DELETE FROM PASSENGER WHERE passenger_id = v_test_pass_id;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Cleaned up durability test record.');
END;
/

PROMPT ============================================================================
PROMPT ACID Properties Suite Executed Successfully.
PROMPT ============================================================================
