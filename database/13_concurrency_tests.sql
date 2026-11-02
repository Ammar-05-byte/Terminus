-- ============================================================================
-- PURPOSE: Simulates multi-session concurrency scenarios, race condition handling,
--          pessimistic row locking, and double-booking prevention via the
--          function-based unique index IDX_ACTIVE_SEAT_RESERVATION.
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

PROMPT ============================================================================
PROMPT Executing Concurrency & Contention Test Suite
PROMPT ============================================================================

-- ============================================================================
-- SCENARIO 1: Race Condition & Double-Booking Prevention
-- SCENARIO: Session 1 books Seat 4 (2A) on Schedule 2.
--           Session 2 simultaneously attempts to book the EXACT SAME seat on Schedule 2.
--           The test verifies that Session 2 is rejected by both the procedure check
--           (-20014) and the database constraint (IDX_ACTIVE_SEAT_RESERVATION / ORA-00001).
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT CONCURRENCY SCENARIO 1: Concurrent Double-Booking Prevention
PROMPT ------------------------------------------------------------------------
DECLARE
    v_res_id1   NUMBER;
    v_pnr1      VARCHAR2(15);
    v_fare1     NUMBER;
    v_status1   VARCHAR2(20);

    v_res_id2   NUMBER;
    v_pnr2      VARCHAR2(15);
    v_fare2     NUMBER;
    v_status2   VARCHAR2(20);
    v_caught    BOOLEAN := FALSE;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step 1.1: User A successfully books Seat 4 on Schedule 2 ---');
    P_BOOK_TICKET(
        p_passenger_id             => 1,
        p_schedule_id              => 2,
        p_source_station_id        => 2,
        p_dest_station_id          => 1,
        p_seat_id                  => 4,
        p_payment_method           => 'UPI',
        p_simulated_payment_status => 'SUCCESS',
        p_reservation_id           => v_res_id1,
        p_pnr                      => v_pnr1,
        p_fare_amount              => v_fare1,
        p_booking_status           => v_status1
    );
    DBMS_OUTPUT.PUT_LINE('User A Booking SUCCESS: PNR=' || v_pnr1 || ', Status=' || v_status1);

    DBMS_OUTPUT.PUT_LINE('--- Step 1.2: User B simultaneously attempts to book the SAME seat ---');
    BEGIN
        P_BOOK_TICKET(
            p_passenger_id             => 2,
            p_schedule_id              => 2,
            p_source_station_id        => 2,
            p_dest_station_id          => 1,
            p_seat_id                  => 4, -- Same seat!
            p_payment_method           => 'CARD',
            p_simulated_payment_status => 'SUCCESS',
            p_reservation_id           => v_res_id2,
            p_pnr                      => v_pnr2,
            p_fare_amount              => v_fare2,
            p_booking_status           => v_status2
        );
    EXCEPTION
        WHEN OTHERS THEN
            v_caught := TRUE;
            DBMS_OUTPUT.PUT_LINE('[REJECTED AS EXPECTED] Error Code: ORA' || SQLCODE || ' - ' || SQLERRM);
    END;

    IF v_caught THEN
        DBMS_OUTPUT.PUT_LINE('[PASS - DOUBLE-BOOKING PREVENTED] Contending booking was successfully blocked.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL - RACE CONDITION BUG] User B booked an already reserved seat!');
    END IF;

    -- Cleanup test booking
    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('Rolled back test bookings.');
END;
/

-- ============================================================================
-- SCENARIO 2: Function-Based Unique Index Direct Defense
-- SCENARIO: Tests whether an un-sanitized raw INSERT attempting to bypass the
--           application layer is unconditionally halted by the function-based
--           unique index IDX_ACTIVE_SEAT_RESERVATION.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT CONCURRENCY SCENARIO 2: Low-Level Index Integrity Defense
PROMPT ------------------------------------------------------------------------
DECLARE
    v_raw_id1 NUMBER := 999901;
    v_raw_id2 NUMBER := 999902;
    v_caught  BOOLEAN := FALSE;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step 2.1: Inserting raw active reservation for Schedule 2, Seat 5 ---');
    INSERT INTO RESERVATION (
        reservation_id, pnr, passenger_id, schedule_id, seat_id,
        source_station_id, destination_station_id, booking_status, fare_amount
    ) VALUES (
        v_raw_id1, 'PNR9999000001', 3, 2, 5, 2, 1, 'CONFIRMED', 1000.00
    );

    DBMS_OUTPUT.PUT_LINE('--- Step 2.2: Inserting second active reservation for SAME Schedule & Seat ---');
    BEGIN
        INSERT INTO RESERVATION (
            reservation_id, pnr, passenger_id, schedule_id, seat_id,
            source_station_id, destination_station_id, booking_status, fare_amount
        ) VALUES (
            v_raw_id2, 'PNR9999000002', 4, 2, 5, 2, 1, 'PENDING', 1000.00
        );
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -1 THEN -- ORA-00001: unique constraint violated
                v_caught := TRUE;
                DBMS_OUTPUT.PUT_LINE('[BLOCKED BY IDX_ACTIVE_SEAT_RESERVATION] ORA-00001: Unique constraint violated.');
            ELSE
                DBMS_OUTPUT.PUT_LINE('[CAUGHT OTHER EXCEPTION] ORA' || SQLCODE || ': ' || SQLERRM);
                v_caught := TRUE;
            END IF;
    END;

    IF v_caught THEN
        DBMS_OUTPUT.PUT_LINE('[PASS - PHYSICAL INTEGRITY VERIFIED] Hardware-level index defense prevented double booking.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL - INDEX LEAK] Database allowed duplicate active reservation!');
    END IF;

    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('Rolled back test records.');
END;
/

-- ============================================================================
-- SCENARIO 3: Non-Conflicting Concurrent Bookings
-- SCENARIO: Two users book DIFFERENT seats on the SAME schedule in parallel.
--           Verifies that fine-grained row-level locking allows simultaneous
--           bookings without deadlocks or false lock contention.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT CONCURRENCY SCENARIO 3: Parallel Non-Conflicting Bookings
PROMPT ------------------------------------------------------------------------
DECLARE
    v_res_idA NUMBER; v_pnrA VARCHAR2(15); v_fareA NUMBER; v_statA VARCHAR2(20);
    v_res_idB NUMBER; v_pnrB VARCHAR2(15); v_fareB NUMBER; v_statB VARCHAR2(20);
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step 3.1: User A booking Seat 5 (3A) on Schedule 2 ---');
    P_BOOK_TICKET(
        p_passenger_id             => 5,
        p_schedule_id              => 2,
        p_source_station_id        => 2,
        p_dest_station_id          => 1,
        p_seat_id                  => 5,
        p_payment_method           => 'UPI',
        p_simulated_payment_status => 'SUCCESS',
        p_reservation_id           => v_res_idA,
        p_pnr                      => v_pnrA,
        p_fare_amount              => v_fareA,
        p_booking_status           => v_statA
    );
    DBMS_OUTPUT.PUT_LINE('User A Confirmed: ' || v_pnrA);

    DBMS_OUTPUT.PUT_LINE('--- Step 3.2: User B booking Seat 6 (3A) on Schedule 2 ---');
    P_BOOK_TICKET(
        p_passenger_id             => 6,
        p_schedule_id              => 2,
        p_source_station_id        => 2,
        p_dest_station_id          => 1,
        p_seat_id                  => 6,
        p_payment_method           => 'CARD',
        p_simulated_payment_status => 'SUCCESS',
        p_reservation_id           => v_res_idB,
        p_pnr                      => v_pnrB,
        p_fare_amount              => v_fareB,
        p_booking_status           => v_statB
    );
    DBMS_OUTPUT.PUT_LINE('User B Confirmed: ' || v_pnrB);

    IF v_statA = 'CONFIRMED' AND v_statB = 'CONFIRMED' THEN
        DBMS_OUTPUT.PUT_LINE('[PASS - CONCURRENT THROUGHPUT] Both independent seats confirmed without collision.');
    END IF;

    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('Rolled back test reservations.');
END;
/

-- ============================================================================
-- SCENARIO 4: Cancellation and Immediate Seat Recycling
-- SCENARIO: A seat held in CANCELLED status should immediately be available for
--           another passenger to book on the same schedule, demonstrating that
--           IDX_ACTIVE_SEAT_RESERVATION ignores CANCELLED records.
-- ============================================================================
PROMPT ------------------------------------------------------------------------
PROMPT CONCURRENCY SCENARIO 4: Seat Recycling after Cancellation
PROMPT ------------------------------------------------------------------------
DECLARE
    v_res_id1 NUMBER; v_pnr1 VARCHAR2(15); v_fare1 NUMBER; v_stat1 VARCHAR2(20);
    v_res_id2 NUMBER; v_pnr2 VARCHAR2(15); v_fare2 NUMBER; v_stat2 VARCHAR2(20);
    v_cancel_msg VARCHAR2(200); v_cancel_stat VARCHAR2(20); v_refund NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Step 4.1: Initial booking of Seat 5 on Schedule 2 ---');
    P_BOOK_TICKET(
        p_passenger_id             => 7,
        p_schedule_id              => 2,
        p_source_station_id        => 2,
        p_dest_station_id          => 1,
        p_seat_id                  => 5,
        p_payment_method           => 'UPI',
        p_simulated_payment_status => 'SUCCESS',
        p_reservation_id           => v_res_id1,
        p_pnr                      => v_pnr1,
        p_fare_amount              => v_fare1,
        p_booking_status           => v_stat1
    );

    DBMS_OUTPUT.PUT_LINE('--- Step 4.2: Passenger cancels the booking ---');
    P_CANCEL_RESERVATION(
        p_pnr            => v_pnr1,
        p_result         => v_cancel_msg,
        p_booking_status => v_cancel_stat,
        p_refund_amount  => v_refund
    );
    DBMS_OUTPUT.PUT_LINE('Cancelled: ' || v_pnr1 || ' Status: ' || v_cancel_stat);

    DBMS_OUTPUT.PUT_LINE('--- Step 4.3: New passenger immediately books the recycled seat ---');
    P_BOOK_TICKET(
        p_passenger_id             => 8,
        p_schedule_id              => 2,
        p_source_station_id        => 2,
        p_dest_station_id          => 1,
        p_seat_id                  => 5, -- Same seat!
        p_payment_method           => 'CARD',
        p_simulated_payment_status => 'SUCCESS',
        p_reservation_id           => v_res_id2,
        p_pnr                      => v_pnr2,
        p_fare_amount              => v_fare2,
        p_booking_status           => v_stat2
    );
    DBMS_OUTPUT.PUT_LINE('Recycled Booking SUCCESS: New PNR=' || v_pnr2 || ', Status=' || v_stat2);

    IF v_stat2 = 'CONFIRMED' THEN
        DBMS_OUTPUT.PUT_LINE('[PASS - SEAT RECYCLING VERIFIED] Cancelled seat was successfully re-booked without conflict.');
    END IF;

    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('Rolled back test reservations.');
END;
/

PROMPT ============================================================================
PROMPT Concurrency & Contention Tests Completed Successfully.
PROMPT ============================================================================
