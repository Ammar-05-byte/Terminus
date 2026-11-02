-- ============================================================================
-- SCRIPT: 11_transaction_demos.sql
-- PROJECT: Railway Reservation System (Terminus DBMS)
-- PURPOSE: Detailed practical demonstrations of Transactions A through E,
--          illustrating explicit transaction boundaries, row-level locks,
--          savepoints, commits, and rollbacks in Oracle PL/SQL.
-- SYNTAX: Oracle PL/SQL
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

PROMPT ============================================================================
PROMPT Running Transaction Demonstrations (Transactions A through E)
PROMPT ============================================================================

-- ============================================================================
-- TRANSACTION A: End-to-End Ticket Booking Transaction (Atomic Commit)
-- SCENARIO: A passenger initiates a booking for Train 1 (Schedule 2). The system
--           locks the schedule, validates route and seat, computes the fare,
--           creates a PENDING reservation, records a SUCCESS payment,
--           and the trigger TRG_SYNC_RESERVATION_ON_PAYMENT automatically
--           confirms the reservation before committing the transaction.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT TRANSACTION A: End-to-End Successful Ticket Booking
PROMPT ------------------------------------------------------------------------
DECLARE
    v_res_id        NUMBER;
    v_pnr           VARCHAR2(15);
    v_fare          NUMBER;
    v_status        VARCHAR2(20);
    v_before_avail  NUMBER;
    v_after_avail   NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step A1: Checking Initial Availability on Schedule 2 ---');
    v_before_avail := F_AVAILABLE_SEAT_COUNT(2, '1A');
    DBMS_OUTPUT.PUT_LINE('Initial Available 1A Seats on Schedule 2: ' || v_before_avail);

    DBMS_OUTPUT.PUT_LINE('--- Step A2: Executing P_BOOK_TICKET for Passenger 1, Seat 1 (1A) ---');
    -- Passenger 1, Schedule 2, Source BCT (2) to NDLS (1), Seat 1 (1A), Card, SUCCESS
    P_BOOK_TICKET(
        p_passenger_id             => 1,
        p_schedule_id              => 2,
        p_source_station_id        => 2,
        p_dest_station_id          => 1,
        p_seat_id                  => 1,
        p_payment_method           => 'CARD',
        p_simulated_payment_status => 'SUCCESS',
        p_reservation_id           => v_res_id,
        p_pnr                      => v_pnr,
        p_fare_amount              => v_fare,
        p_booking_status           => v_status
    );

    DBMS_OUTPUT.PUT_LINE('Generated PNR           : ' || v_pnr);
    DBMS_OUTPUT.PUT_LINE('Reservation ID          : ' || v_res_id);
    DBMS_OUTPUT.PUT_LINE('Computed Fare (INR)     : ' || v_fare);
    DBMS_OUTPUT.PUT_LINE('Booking Status          : ' || v_status);

    -- Step A3: Explicit COMMIT persists the reservation and payment atomically
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('--- Step A3: Transaction Committed Successfully ---');

    v_after_avail := F_AVAILABLE_SEAT_COUNT(2, '1A');
    DBMS_OUTPUT.PUT_LINE('Post-Booking Available 1A Seats on Schedule 2: ' || v_after_avail);
    DBMS_OUTPUT.PUT_LINE('Seat count decreased by : ' || (v_before_avail - v_after_avail));
END;
/

-- ============================================================================
-- TRANSACTION B: Payment Gateway Failure & Savepoint Rollback
-- SCENARIO: A passenger initiates a booking, but their card is declined (FAILED).
--           The application sets a SAVEPOINT before booking. When payment fails,
--           the transaction rolls back to the savepoint, unwinding the pending hold
--           so no uncommitted or orphaned records remain in the database.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT TRANSACTION B: Payment Failure and Transaction Rollback
PROMPT ------------------------------------------------------------------------
DECLARE
    v_res_id        NUMBER;
    v_pnr           VARCHAR2(15);
    v_fare          NUMBER;
    v_status        VARCHAR2(20);
    v_count_check   NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step B1: Establishing Savepoint before booking attempt ---');
    SAVEPOINT sp_before_payment_attempt;

    DBMS_OUTPUT.PUT_LINE('--- Step B2: Initiating booking with simulated FAILED payment ---');
    -- Passenger 2, Schedule 2, Source BCT (2) to NDLS (1), Seat 2 (1A), UPI, FAILED
    P_BOOK_TICKET(
        p_passenger_id             => 2,
        p_schedule_id              => 2,
        p_source_station_id        => 2,
        p_dest_station_id          => 1,
        p_seat_id                  => 2,
        p_payment_method           => 'UPI',
        p_simulated_payment_status => 'FAILED',
        p_reservation_id           => v_res_id,
        p_pnr                      => v_pnr,
        p_fare_amount              => v_fare,
        p_booking_status           => v_status
    );

    DBMS_OUTPUT.PUT_LINE('Created PNR with status : ' || v_status || ' (ID: ' || v_res_id || ')');

    DBMS_OUTPUT.PUT_LINE('--- Step B3: Payment was declined! Rolling back to savepoint ---');
    ROLLBACK TO sp_before_payment_attempt;
    DBMS_OUTPUT.PUT_LINE('Rolled back transaction to sp_before_payment_attempt.');

    -- Verify that the pending reservation was wiped clean by rollback
    SELECT COUNT(*) INTO v_count_check FROM RESERVATION WHERE reservation_id = v_res_id;
    DBMS_OUTPUT.PUT_LINE('Reservation records found after rollback: ' || v_count_check || ' (Expected: 0)');

    -- Release any active transaction
    COMMIT;
END;
/

-- ============================================================================
-- TRANSACTION C: Reservation Cancellation with Automatic Refund
-- SCENARIO: The user cancels the booking created in Transaction A (Seat 1 on Schedule 2).
--           The procedure P_CANCEL_RESERVATION locks the reservation, marks it
--           'CANCELLED', computes net paid amount (F_NET_PAID_AMOUNT), and logs a
--           REFUND_SUCCESS payment record. Seat is immediately released for re-booking.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT TRANSACTION C: Cancellation and Automatic Refund Processing
PROMPT ------------------------------------------------------------------------
DECLARE
    v_target_pnr    VARCHAR2(15);
    v_result        VARCHAR2(200);
    v_status        VARCHAR2(20);
    v_refund_amt    NUMBER;
    v_avail_after   NUMBER;
BEGIN
    -- Locate the latest confirmed reservation on Schedule 2 (created in Transaction A)
    SELECT pnr
    INTO v_target_pnr
    FROM RESERVATION
    WHERE schedule_id = 2 AND seat_id = 1 AND booking_status = 'CONFIRMED';

    DBMS_OUTPUT.PUT_LINE('--- Step C1: Cancelling PNR ' || v_target_pnr || ' ---');

    P_CANCEL_RESERVATION(
        p_pnr            => v_target_pnr,
        p_result         => v_result,
        p_booking_status => v_status,
        p_refund_amount  => v_refund_amt
    );

    DBMS_OUTPUT.PUT_LINE('Result Message  : ' || v_result);
    DBMS_OUTPUT.PUT_LINE('New Status      : ' || v_status);
    DBMS_OUTPUT.PUT_LINE('Refund Amount   : INR ' || v_refund_amt);

    -- Step C2: Explicit COMMIT confirms cancellation and refund
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('--- Step C2: Cancellation Transaction Committed ---');

    -- Verify seat is restored to available pool
    v_avail_after := F_AVAILABLE_SEAT_COUNT(2, '1A');
    DBMS_OUTPUT.PUT_LINE('Available 1A Seats on Schedule 2 after Cancellation: ' || v_avail_after);
END;
/

-- ============================================================================
-- TRANSACTION D: Stale Reservation Expiry Batch Sweep
-- SCENARIO: Insert a synthetic pending reservation timestamped 20 minutes ago.
--           Execute P_EXPIRE_STALE_RESERVATIONS(p_max_age_minutes => 15) to sweep
--           and expire all abandoned holds, freeing allocated seats.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT TRANSACTION D: Stale Reservation Expiry Batch Transaction
PROMPT ------------------------------------------------------------------------
DECLARE
    v_fake_res_id NUMBER;
    v_expired_cnt NUMBER;
    v_status      VARCHAR2(20);
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step D1: Simulating an abandoned reservation from 25 minutes ago ---');
    v_fake_res_id := SEQ_RESERVATION_ID.NEXTVAL;

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
        v_fake_res_id,
        'PNR9999999999',
        3,
        2,
        3, -- Train 1, Seat 3 (2A)
        2,
        1,
        SYSTIMESTAMP - NUMTODSINTERVAL(25, 'MINUTE'),
        'PENDING',
        885.60
    );

    DBMS_OUTPUT.PUT_LINE('Inserted pending hold ID ' || v_fake_res_id || ' timestamped 25 min ago.');

    DBMS_OUTPUT.PUT_LINE('--- Step D2: Executing P_EXPIRE_STALE_RESERVATIONS (Threshold: 15 mins) ---');
    P_EXPIRE_STALE_RESERVATIONS(p_max_age_minutes => 15, p_expired_count => v_expired_cnt);

    DBMS_OUTPUT.PUT_LINE('Total Stale Reservations Expired: ' || v_expired_cnt);

    SELECT booking_status INTO v_status FROM RESERVATION WHERE reservation_id = v_fake_res_id;
    DBMS_OUTPUT.PUT_LINE('Verified Status of Reservation ' || v_fake_res_id || ': ' || v_status);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('--- Step D3: Batch Sweep Committed ---');
END;
/

-- ============================================================================
-- TRANSACTION E: Seat Contention & Deadlock Avoidance Strategy
-- SCENARIO: Demonstrates strict hierarchical resource locking (Train Schedule ->
--           Seat) using SELECT ... FOR UPDATE NOWAIT to guarantee atomic
--           contention handling without encountering cyclic deadlocks (ORA-00060).
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT TRANSACTION E: Deadlock Avoidance & Pessimistic Seat Locking
PROMPT ------------------------------------------------------------------------
DECLARE
    v_sched_id   NUMBER := 2;
    v_seat_id    NUMBER := 4; -- Train 1, Seat 4 (2A)
    v_train_id   NUMBER;
    v_seat_code  VARCHAR2(20);
    v_lock_err   EXCEPTION;
    PRAGMA EXCEPTION_INIT(v_lock_err, -54); -- ORA-00054: resource busy and acquire with NOWAIT
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step E1: Locking Schedule Root (Hierarchical Lock Order 1) ---');
    SELECT train_id
    INTO v_train_id
    FROM TRAIN_SCHEDULE
    WHERE schedule_id = v_sched_id
    FOR UPDATE NOWAIT;

    DBMS_OUTPUT.PUT_LINE('Acquired lock on Schedule ' || v_sched_id || ' (Train ID: ' || v_train_id || ')');

    DBMS_OUTPUT.PUT_LINE('--- Step E2: Locking Specific Seat (Hierarchical Lock Order 2) ---');
    SELECT coach_number || '-' || seat_number
    INTO v_seat_code
    FROM SEAT
    WHERE seat_id = v_seat_id
      AND train_id = v_train_id
    FOR UPDATE NOWAIT;

    DBMS_OUTPUT.PUT_LINE('Acquired exclusive lock on Seat ' || v_seat_code || ' (Seat ID: ' || v_seat_id || ')');
    DBMS_OUTPUT.PUT_LINE('Both resources locked safely in consistent canonical order.');

    -- Release locks
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('--- Step E3: Released locks via COMMIT ---');
EXCEPTION
    WHEN v_lock_err THEN
        DBMS_OUTPUT.PUT_LINE('[CONTENTION DETECTED] Resource currently locked by concurrent transaction.');
        ROLLBACK;
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('[ERROR] ' || SQLERRM);
        ROLLBACK;
        RAISE;
END;
/

PROMPT ============================================================================
PROMPT Transaction Demonstrations Completed Successfully.
PROMPT ============================================================================
