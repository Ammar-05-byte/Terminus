-- ============================================================================
-- SCRIPT: 02_create_tables.sql
-- PROJECT: Railway Reservation System (Terminus DBMS)
-- PURPOSE: Create the 8 core relational tables with primary keys, foreign keys,
--          unique constraints, and check constraints.
-- SYNTAX: Oracle SQL / DDL
-- ============================================================================

PROMPT ============================================================================
PROMPT Creating Core Business Tables (8 Tables)
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE: PASSENGER
-- Stores passenger demographic and contact profiles.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: PASSENGER...
CREATE TABLE PASSENGER (
    passenger_id    NUMBER             CONSTRAINT pk_passenger PRIMARY KEY,
    full_name       VARCHAR2(100)      NOT NULL,
    date_of_birth   DATE               NOT NULL,
    gender          VARCHAR2(10)       NOT NULL,
    phone           VARCHAR2(15)       NOT NULL,
    email           VARCHAR2(100)      NOT NULL,
    CONSTRAINT chk_passenger_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT uq_passenger_phone   UNIQUE (phone),
    CONSTRAINT uq_passenger_email   UNIQUE (email)
);

COMMENT ON TABLE PASSENGER IS 'Stores registered passenger profiles, personal details, and contact identifiers.';
COMMENT ON COLUMN PASSENGER.passenger_id IS 'Surrogate primary key for passenger entity.';
COMMENT ON COLUMN PASSENGER.full_name IS 'Full legal name of passenger.';
COMMENT ON COLUMN PASSENGER.date_of_birth IS 'Date of birth for age/concession evaluation.';
COMMENT ON COLUMN PASSENGER.gender IS 'Gender category: Male, Female, or Other.';
COMMENT ON COLUMN PASSENGER.phone IS 'Unique mobile contact number with international prefix support.';
COMMENT ON COLUMN PASSENGER.email IS 'Unique primary email address.';

-- ----------------------------------------------------------------------------
-- 2. TABLE: STATION
-- Stores railway station codes, names, and geographic locations.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: STATION...
CREATE TABLE STATION (
    station_id      NUMBER             CONSTRAINT pk_station PRIMARY KEY,
    station_code    VARCHAR2(10)       NOT NULL,
    station_name    VARCHAR2(100)      NOT NULL,
    city            VARCHAR2(50)       NOT NULL,
    state           VARCHAR2(50)       NOT NULL,
    CONSTRAINT uq_station_code UNIQUE (station_code)
);

COMMENT ON TABLE STATION IS 'Master registry of physical railway stations and junction points.';
COMMENT ON COLUMN STATION.station_id IS 'Surrogate primary key for station entity.';
COMMENT ON COLUMN STATION.station_code IS 'Official IR station code (e.g., NDLS, BCT, MAS).';
COMMENT ON COLUMN STATION.station_name IS 'Full standard station title.';
COMMENT ON COLUMN STATION.city IS 'City location of station.';
COMMENT ON COLUMN STATION.state IS 'State/Province jurisdiction of station.';

-- ----------------------------------------------------------------------------
-- 3. TABLE: TRAIN
-- Stores train master details including unique train numbers and operational status.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: TRAIN...
CREATE TABLE TRAIN (
    train_id        NUMBER             CONSTRAINT pk_train PRIMARY KEY,
    train_number    VARCHAR2(10)       NOT NULL,
    train_name      VARCHAR2(100)      NOT NULL,
    train_type      VARCHAR2(30)       NOT NULL,
    active_status   VARCHAR2(10)       DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT uq_train_number  UNIQUE (train_number),
    CONSTRAINT chk_train_type   CHECK (train_type IN ('Express', 'Superfast', 'Rajdhani', 'Shatabdi', 'Duronto', 'Local', 'Mail')),
    CONSTRAINT chk_train_status CHECK (active_status IN ('ACTIVE', 'INACTIVE'))
);

COMMENT ON TABLE TRAIN IS 'Master catalog of trains operating within the rail network.';
COMMENT ON COLUMN TRAIN.train_id IS 'Surrogate primary key for train entity.';
COMMENT ON COLUMN TRAIN.train_number IS 'Official 5-digit IR train identification code.';
COMMENT ON COLUMN TRAIN.train_name IS 'Popular operational name of train (e.g., Mumbai Rajdhani Express).';
COMMENT ON COLUMN TRAIN.train_type IS 'Category classification of train service.';
COMMENT ON COLUMN TRAIN.active_status IS 'Operational lifecycle state (ACTIVE / INACTIVE).';

-- ----------------------------------------------------------------------------
-- 4. TABLE: TRAIN_STOP
-- Defines the ordered route stops, arrival/departure schedules, and cumulative distance.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: TRAIN_STOP...
CREATE TABLE TRAIN_STOP (
    train_id                NUMBER        NOT NULL,
    stop_sequence           NUMBER        NOT NULL,
    station_id              NUMBER        NOT NULL,
    arrival_time            VARCHAR2(5),  -- Format: HH24:MI (NULL for origin)
    departure_time          VARCHAR2(5),  -- Format: HH24:MI (NULL for terminus)
    distance_from_origin_km NUMBER        NOT NULL,
    CONSTRAINT pk_train_stop        PRIMARY KEY (train_id, stop_sequence),
    CONSTRAINT uq_train_stop_station UNIQUE (train_id, station_id),
    CONSTRAINT fk_stop_train        FOREIGN KEY (train_id) REFERENCES TRAIN(train_id) ON DELETE CASCADE,
    CONSTRAINT fk_stop_station      FOREIGN KEY (station_id) REFERENCES STATION(station_id),
    CONSTRAINT chk_stop_dist        CHECK (distance_from_origin_km >= 0)
);

COMMENT ON TABLE TRAIN_STOP IS 'Ordered route itinerary and intermediate stopping stations for each train.';
COMMENT ON COLUMN TRAIN_STOP.train_id IS 'Foreign key referencing TRAIN.';
COMMENT ON COLUMN TRAIN_STOP.stop_sequence IS '1-based sequential stop order along the route.';
COMMENT ON COLUMN TRAIN_STOP.station_id IS 'Foreign key referencing STATION.';
COMMENT ON COLUMN TRAIN_STOP.arrival_time IS 'Scheduled 24-hr arrival time string (HH24:MI); null at origin.';
COMMENT ON COLUMN TRAIN_STOP.departure_time IS 'Scheduled 24-hr departure time string (HH24:MI); null at terminus.';
COMMENT ON COLUMN TRAIN_STOP.distance_from_origin_km IS 'Cumulative rail track distance from origin station in km.';

-- ----------------------------------------------------------------------------
-- 5. TABLE: TRAIN_SCHEDULE
-- Represents calendar-specific runs of scheduled trains.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: TRAIN_SCHEDULE...
CREATE TABLE TRAIN_SCHEDULE (
    schedule_id         NUMBER             CONSTRAINT pk_train_schedule PRIMARY KEY,
    train_id            NUMBER             NOT NULL,
    journey_date        DATE               NOT NULL,
    scheduled_departure TIMESTAMP          NOT NULL,
    scheduled_arrival   TIMESTAMP          NOT NULL,
    schedule_status     VARCHAR2(20)       DEFAULT 'SCHEDULED' NOT NULL,
    CONSTRAINT fk_sched_train    FOREIGN KEY (train_id) REFERENCES TRAIN(train_id) ON DELETE CASCADE,
    CONSTRAINT uq_train_schedule UNIQUE (train_id, journey_date),
    CONSTRAINT chk_sched_status  CHECK (schedule_status IN ('SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED'))
);

COMMENT ON TABLE TRAIN_SCHEDULE IS 'Calendar run instances of train services for reservation and operations.';
COMMENT ON COLUMN TRAIN_SCHEDULE.schedule_id IS 'Surrogate primary key for trip schedule.';
COMMENT ON COLUMN TRAIN_SCHEDULE.train_id IS 'Foreign key referencing TRAIN.';
COMMENT ON COLUMN TRAIN_SCHEDULE.journey_date IS 'Calendar date of origin departure.';
COMMENT ON COLUMN TRAIN_SCHEDULE.scheduled_departure IS 'Exact timestamp of scheduled trip origin departure.';
COMMENT ON COLUMN TRAIN_SCHEDULE.scheduled_arrival IS 'Exact timestamp of scheduled trip terminus arrival.';
COMMENT ON COLUMN TRAIN_SCHEDULE.schedule_status IS 'Run execution status: SCHEDULED, RUNNING, COMPLETED, CANCELLED.';

-- ----------------------------------------------------------------------------
-- 6. TABLE: SEAT
-- Physical inventory of coaches, seat numbers, classes, and berth types per train.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: SEAT...
CREATE TABLE SEAT (
    seat_id         NUMBER             CONSTRAINT pk_seat PRIMARY KEY,
    train_id        NUMBER             NOT NULL,
    coach_number    VARCHAR2(10)       NOT NULL,
    seat_number     NUMBER             NOT NULL,
    coach_class     VARCHAR2(10)       NOT NULL,
    berth_type      VARCHAR2(10),
    CONSTRAINT fk_seat_train       FOREIGN KEY (train_id) REFERENCES TRAIN(train_id) ON DELETE CASCADE,
    CONSTRAINT uq_train_coach_seat UNIQUE (train_id, coach_number, seat_number),
    CONSTRAINT chk_seat_class      CHECK (coach_class IN ('SL', '3A', '2A', '1A', 'CC', '2S', 'EC')),
    CONSTRAINT chk_seat_berth      CHECK (berth_type IN ('LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER', 'WINDOW', 'AISLE', 'NA'))
);

COMMENT ON TABLE SEAT IS 'Physical seat layout configuration per train rake.';
COMMENT ON COLUMN SEAT.seat_id IS 'Surrogate primary key for seat unit.';
COMMENT ON COLUMN SEAT.train_id IS 'Foreign key referencing TRAIN.';
COMMENT ON COLUMN SEAT.coach_number IS 'Coach alphanumeric label (e.g., S1, B1, A1, H1, C1, D1).';
COMMENT ON COLUMN SEAT.seat_number IS 'Seat or berth sequence index within coach.';
COMMENT ON COLUMN SEAT.coach_class IS 'Travel class: SL (Sleeper), 3A (AC 3-Tier), 2A (AC 2-Tier), 1A (AC First), CC (AC Chair), 2S (Second Sitting), EC (Exec Chair).';
COMMENT ON COLUMN SEAT.berth_type IS 'Positioning code: LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER, WINDOW, AISLE, NA.';

-- ----------------------------------------------------------------------------
-- 7. TABLE: RESERVATION
-- Individual passenger bookings across schedules and seat allocations.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: RESERVATION...
CREATE TABLE RESERVATION (
    reservation_id          NUMBER             CONSTRAINT pk_reservation PRIMARY KEY,
    pnr                     VARCHAR2(15)       NOT NULL,
    passenger_id            NUMBER             NOT NULL,
    schedule_id             NUMBER             NOT NULL,
    seat_id                 NUMBER,            -- Nullable: unassigned/waitlisted or during hold
    source_station_id       NUMBER             NOT NULL,
    destination_station_id  NUMBER             NOT NULL,
    booking_timestamp       TIMESTAMP          DEFAULT SYSTIMESTAMP NOT NULL,
    booking_status          VARCHAR2(20)       DEFAULT 'PENDING' NOT NULL,
    fare_amount             NUMBER(10,2),
    CONSTRAINT uq_reservation_pnr   UNIQUE (pnr),
    CONSTRAINT fk_res_passenger     FOREIGN KEY (passenger_id) REFERENCES PASSENGER(passenger_id),
    CONSTRAINT fk_res_schedule      FOREIGN KEY (schedule_id) REFERENCES TRAIN_SCHEDULE(schedule_id),
    CONSTRAINT fk_res_seat          FOREIGN KEY (seat_id) REFERENCES SEAT(seat_id),
    CONSTRAINT fk_res_src           FOREIGN KEY (source_station_id) REFERENCES STATION(station_id),
    CONSTRAINT fk_res_dest          FOREIGN KEY (destination_station_id) REFERENCES STATION(station_id),
    CONSTRAINT chk_res_status       CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT chk_res_fare         CHECK (fare_amount IS NULL OR fare_amount >= 0),
    CONSTRAINT chk_res_src_dest     CHECK (source_station_id <> destination_station_id)
);

COMMENT ON TABLE RESERVATION IS 'Booking reservations, passenger assignments, and trip lifecycle states.';
COMMENT ON COLUMN RESERVATION.reservation_id IS 'Surrogate primary key for reservation.';
COMMENT ON COLUMN RESERVATION.pnr IS 'Unique 10-12 character Passenger Name Record code.';
COMMENT ON COLUMN RESERVATION.passenger_id IS 'Foreign key referencing PASSENGER.';
COMMENT ON COLUMN RESERVATION.schedule_id IS 'Foreign key referencing TRAIN_SCHEDULE.';
COMMENT ON COLUMN RESERVATION.seat_id IS 'Foreign key referencing allocated SEAT (nullable).';
COMMENT ON COLUMN RESERVATION.source_station_id IS 'Boarding station foreign key.';
COMMENT ON COLUMN RESERVATION.destination_station_id IS 'Deboarding station foreign key.';
COMMENT ON COLUMN RESERVATION.booking_timestamp IS 'Exact system timestamp when booking was initiated.';
COMMENT ON COLUMN RESERVATION.booking_status IS 'Booking status: PENDING, CONFIRMED, CANCELLED, EXPIRED.';
COMMENT ON COLUMN RESERVATION.fare_amount IS 'Calculated total fare for the route and class.';

-- ----------------------------------------------------------------------------
-- 8. TABLE: PAYMENT
-- Financial payment records, gateway transactions, and refund operations.
-- ----------------------------------------------------------------------------
PROMPT Creating Table: PAYMENT...
CREATE TABLE PAYMENT (
    payment_id              NUMBER             CONSTRAINT pk_payment PRIMARY KEY,
    reservation_id          NUMBER             NOT NULL,
    amount                  NUMBER(10,2)       NOT NULL,
    payment_method          VARCHAR2(20)       NOT NULL,
    payment_status          VARCHAR2(20)       NOT NULL,
    transaction_reference   VARCHAR2(50)       NOT NULL,
    payment_timestamp       TIMESTAMP          DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT fk_pay_reservation  FOREIGN KEY (reservation_id) REFERENCES RESERVATION(reservation_id),
    CONSTRAINT uq_pay_txn_ref      UNIQUE (transaction_reference),
    CONSTRAINT chk_pay_amount      CHECK (amount >= 0),
    CONSTRAINT chk_pay_method      CHECK (payment_method IN ('UPI', 'CARD', 'NET_BANKING', 'CASH', 'REFUND')),
    CONSTRAINT chk_pay_status      CHECK (payment_status IN ('SUCCESS', 'FAILED', 'REFUND_SUCCESS'))
);

COMMENT ON TABLE PAYMENT IS 'Financial transactions, digital payment settlements, and refund logs.';
COMMENT ON COLUMN PAYMENT.payment_id IS 'Surrogate primary key for payment transaction.';
COMMENT ON COLUMN PAYMENT.reservation_id IS 'Foreign key referencing RESERVATION.';
COMMENT ON COLUMN PAYMENT.amount IS 'Monetary transaction amount in INR.';
COMMENT ON COLUMN PAYMENT.payment_method IS 'Settlement channel: UPI, CARD, NET_BANKING, CASH, REFUND.';
COMMENT ON COLUMN PAYMENT.payment_status IS 'Transaction gateway status: SUCCESS, FAILED, REFUND_SUCCESS.';
COMMENT ON COLUMN PAYMENT.transaction_reference IS 'Unique gateway or bank reference identifier.';
COMMENT ON COLUMN PAYMENT.payment_timestamp IS 'Timestamp when transaction was registered.';

PROMPT ============================================================================
PROMPT Tables Created Successfully.
PROMPT ============================================================================
