# Master System Test Cases Specification

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/TEST_CASES.md`  

---

## 1. Quality Assurance & Test Strategy

This document specifies **36 comprehensive test cases** covering the **Terminus Railway Reservation System**. The testing framework spans four distinct verification categories:
1. **Database Tier (DB):** Verifying declarative constraints, foreign keys, triggers, stored procedures, functions, explicit cursors, and function-based unique indexes.
2. **Backend API Tier (BE):** Verifying Spring Boot REST endpoints, parameter bindings, DTO validation, and exception handling.
3. **Integration Tier (INT):** Verifying multi-tier workflows connecting the UI, backend JDBC, and Oracle database.
4. **Frontend Client Tier (UI):** Verifying React user interface components, input forms, seat maps, and the Database Operations Lab.

---

## 2. Master Test Cases Matrix (TC-01 through TC-36)

| TC-ID | Category | Description | Steps | Expected Result | Status |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **TC-01** | Database | Duplicate Primary Key rejection in `PASSENGER` | 1. Insert passenger with `passenger_id = 1`.<br>2. Attempt to insert second passenger with `passenger_id = 1`. | Second insert rejected with error `ORA-00001: unique constraint violated`. | **PASS** |
| **TC-02** | Database | Unique constraint rejection on `PASSENGER.phone` | 1. Insert passenger with phone `+919876543210`.<br>2. Attempt to insert new passenger with identical phone. | Rejected with `ORA-00001 (UQ_PASSENGER_PHONE)`. Zero rows added. | **PASS** |
| **TC-03** | Database | Gender check constraint validation in `PASSENGER` | Attempt to insert passenger with `gender = 'Invalid'`. | Rejected with `ORA-02290: check constraint (CHK_PASSENGER_GENDER) violated`. | **PASS** |
| **TC-04** | Database | Duplicate Station Code rejection in `STATION` | Attempt to insert station with code `'NDLS'` when NDLS already exists. | Rejected with `ORA-00001 (UQ_STATION_CODE)`. Duplicate code blocked. | **PASS** |
| **TC-05** | Database | Train category check constraint in `TRAIN` | Attempt to insert train with `train_type = 'Bullet'`. | Rejected with `ORA-02290 (CHK_TRAIN_TYPE)`. Must be valid category. | **PASS** |
| **TC-06** | Database | Foreign Key referential check on `TRAIN_STOP` | Attempt to insert stop record referencing non-existent `train_id = 9999`. | Rejected with `ORA-02291: integrity constraint (FK_STOP_TRAIN) violated`. | **PASS** |
| **TC-07** | Database | Unique train stop station per route | Attempt to insert two stops for same train referencing identical `station_id`. | Rejected with `ORA-00001 (UQ_TRAIN_STOP_STATION)`. | **PASS** |
| **TC-08** | Database | Negative stop distance rejection in `TRAIN_STOP` | Insert stop record with `distance_from_origin_km = -50`. | Rejected with `ORA-02290 (CHK_STOP_DIST)`. Distance must be $\ge 0$. | **PASS** |
| **TC-09** | Database | Same-day duplicate schedule prevention | Insert two schedules for same `train_id` on identical `journey_date`. | Rejected with `ORA-00001 (UQ_TRAIN_SCHEDULE)`. One run per date allowed. | **PASS** |
| **TC-10** | Database | Source equals destination check in `RESERVATION` | Insert reservation where `source_station_id = destination_station_id`. | Rejected with `ORA-02290 (CHK_RES_SRC_DEST)`. | **PASS** |
| **TC-11** | Database | Negative fare check constraint in `RESERVATION` | Insert reservation with `fare_amount = -150.00`. | Rejected with `ORA-02290 (CHK_RES_FARE)`. Fares must be $\ge 0$. | **PASS** |
| **TC-12** | Database | Trigger: Reverse route stop sequence rejection | Insert reservation where source stop sequence $>$ destination stop sequence on train route. | Blocked by trigger `TRG_VALIDATE_RESERVATION` with error `ORA-20004`. | **PASS** |
| **TC-13** | Database | Trigger: Seat rake ownership validation | Insert reservation with `seat_id` belonging to Train 2 onto Schedule of Train 1. | Blocked by trigger `TRG_VALIDATE_RESERVATION` with error `ORA-20005`. | **PASS** |
| **TC-14** | Database | Trigger: Auto-confirmation on payment success | Insert payment with `payment_status = 'SUCCESS'` for pending reservation. | Trigger `TRG_SYNC_RESERVATION_ON_PAYMENT` updates status to `CONFIRMED`. | **PASS** |
| **TC-15** | Database | Function `F_CALCULATE_FARE` distance multiplier | Execute function for 500 km journey in class `3A` (rate 1.20). | Returns exactly ₹600.00 ($500 \times 1.20$). Minimum ₹50 floor respected. | **PASS** |
| **TC-16** | Database | Function `F_AVAILABLE_SEAT_COUNT` deduction | Execute function before and after confirming a reservation on a schedule. | Available seat count decrements exactly by 1. | **PASS** |
| **TC-17** | Database | Double-booking prevention via `IDX_ACTIVE_SEAT_RESERVATION` | Concurrently insert two active reservations for same `(schedule_id, seat_id)`. | Second insert rejected with `ORA-00001`. Double booking physically blocked. | **PASS** |
| **TC-18** | Database | Cursor batch sweep in `P_EXPIRE_STALE_RESERVATIONS` | Insert pending reservation older than 20 mins; execute procedure with 15 min limit. | Sweeps reservation, sets status to `EXPIRED`, and returns `expired_count = 1`. | **PASS** |
| **TC-19** | Backend | REST GET `/api/v1/stations` retrieves all stations | Send HTTP GET to `/api/v1/stations`. | Returns HTTP 200 with JSON array of 10 stations including NDLS and BCT. | **PASS** |
| **TC-20** | Backend | REST POST `/api/v1/passengers` validation | Send POST with empty `fullName` or malformed email. | Returns HTTP 400 Bad Request with field validation error messages. | **PASS** |
| **TC-21** | Backend | REST POST `/api/v1/passengers` duplicate conflict | Send POST with email already registered in database. | Handled by `GlobalExceptionHandler`; returns HTTP 409 Conflict. | **PASS** |
| **TC-22** | Backend | REST GET `/api/v1/trains/search` query parameter binding | Query `/api/v1/trains/search?sourceStationId=1&destStationId=2&journeyDate=2026-11-05`. | Returns HTTP 200 with valid train options, departure times, and seat count. | **PASS** |
| **TC-23** | Backend | REST POST `/api/v1/reservations/book` atomic booking | Send valid `BookingRequest` DTO with payment method `CARD`. | Returns HTTP 201 Created with generated PNR, fare, and status `CONFIRMED`. | **PASS** |
| **TC-24** | Backend | REST POST `/api/v1/reservations/book` failed payment rollback | Send `BookingRequest` with `simulatedPaymentStatus = 'FAILED'`. | Backend rolls back transaction. Returns HTTP 400. Zero orphan records left. | **PASS** |
| **TC-25** | Backend | REST GET `/api/v1/reservations/{pnr}` status tracking | Query reservation details using valid PNR string. | Returns HTTP 200 with passenger, train, seat, stations, and payment info. | **PASS** |
| **TC-26** | Backend | REST POST `/api/v1/reservations/cancel` refund calculation | Send cancellation request for confirmed ticket with ₹4152 paid. | Returns HTTP 200 with status `CANCELLED` and refund amount `4152.00`. | **PASS** |
| **TC-27** | Backend | REST POST `/api/v1/reservations/cancel` duplicate rejection | Attempt to cancel a ticket that is already in `CANCELLED` status. | Rejected with HTTP 400 Bad Request (`ORA-20030: Already cancelled`). | **PASS** |
| **TC-28** | Backend | REST GET `/api/v1/admin/queries/Q05` execution | Request top 5 busiest routes query from admin API. | Returns HTTP 200 with dynamic rows, columns, and execution time $\le 50$ms. | **PASS** |
| **TC-29** | Integration | End-to-end booking and immediate seat map reflection | 1. Check seat availability on UI.<br>2. Complete booking for Seat 4.<br>3. Refresh seat map. | Seat 4 immediately changes status from green (Available) to red (Booked). | **PASS** |
| **TC-30** | Integration | End-to-end cancellation and immediate seat release | 1. Cancel booking for Seat 4 via PNR.<br>2. Check seat availability. | Seat 4 transitions immediately back to Available and is re-bookable. | **PASS** |
| **TC-31** | Integration | Concurrency stress test on single seat | Launch 5 concurrent threads attempting to book Seat 1 on Schedule 2. | Exactly 1 thread succeeds (CONFIRMED); 4 threads fail with error message. | **PASS** |
| **TC-32** | Integration | Cascade deletion of train rake | Admin deletes Train 1 (`train_id = 1`). | Associated stops, schedules, and seats are deleted automatically via cascade. | **PASS** |
| **TC-33** | Frontend | Train search form UI validation | User clicks Search without selecting source and destination stations. | UI displays inline validation alert: "Please select origin and destination". | **PASS** |
| **TC-34** | Frontend | Interactive seat map visual selection | User clicks on Coach B1, Seat 12. | Seat highlights with selection border; booking drawer populates seat details. | **PASS** |
| **TC-35** | Frontend | PNR status search and display | Enter valid PNR in tracking search bar. | Displays passenger itinerary card with journey date, coach, seat, and status badge. | **PASS** |
| **TC-36** | Frontend | Database Operations Lab query execution | Select Query Q14 (Double-booking audit) and click Run. | Results grid renders with 0 rows, confirming zero double bookings exist. | **PASS** |
