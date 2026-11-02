-- ============================================================================
-- PURPOSE: Insert realistic, production-grade seed data across all 8 tables.
--          - 15 Passengers
--          - 12 Major Indian Stations
--          - 10 Operational Trains
--          - 40+ Train Stops
--          - 16 Train Schedules (relative to SYSDATE)
--          - 60 Physical Seats across all travel classes
--          - 15 Reservations (CONFIRMED, PENDING, CANCELLED)
--          - 18 Payment Transactions (SUCCESS, FAILED, REFUND_SUCCESS)
--          Explicit IDs are used for consistent foreign key integrity.
--          All sequences are automatically synced after insertion.
-- ============================================================================

PROMPT ============================================================================
PROMPT Inserting Master Seed Data
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED: PASSENGER (15 Records)
-- ----------------------------------------------------------------------------
PROMPT Populating PASSENGER...
INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (1, 'Rahul Sharma', DATE '1988-04-12', 'Male', '+919876543210', 'rahul.sharma@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (2, 'Priya Patel', DATE '1992-08-25', 'Female', '+919876543211', 'priya.patel@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (3, 'Amit Kumar', DATE '1985-01-15', 'Male', '+919876543212', 'amit.kumar@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (4, 'Sneha Iyer', DATE '1995-11-03', 'Female', '+919876543213', 'sneha.iyer@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (5, 'Vikram Singh', DATE '1980-06-30', 'Male', '+919876543214', 'vikram.singh@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (6, 'Ananya Roy', DATE '1998-03-22', 'Female', '+919876543215', 'ananya.roy@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (7, 'Mohammed Farooq', DATE '1991-09-18', 'Male', '+919876543216', 'mohammed.farooq@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (8, 'Pooja Hegde', DATE '1994-12-05', 'Female', '+919876543217', 'pooja.hegde@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (9, 'Rajesh Verma', DATE '1975-07-19', 'Male', '+919876543218', 'rajesh.verma@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (10, 'Kavita Nair', DATE '1989-05-14', 'Female', '+919876543219', 'kavita.nair@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (11, 'Suresh Menon', DATE '1982-10-28', 'Male', '+919876543220', 'suresh.menon@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (12, 'Neha Gupta', DATE '1996-02-17', 'Female', '+919876543221', 'neha.gupta@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (13, 'Deepak Joshi', DATE '1979-12-01', 'Male', '+919876543222', 'deepak.joshi@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (14, 'Sunita Rao', DATE '1986-04-09', 'Female', '+919876543223', 'sunita.rao@example.com');

INSERT INTO PASSENGER (passenger_id, full_name, date_of_birth, gender, phone, email)
VALUES (15, 'Rohit Das', DATE '1993-07-21', 'Male', '+919876543224', 'rohit.das@example.com');

-- ----------------------------------------------------------------------------
-- 2. SEED: STATION (12 Major Indian Stations)
-- ----------------------------------------------------------------------------
PROMPT Populating STATION...
INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (1, 'NDLS', 'New Delhi Railway Station', 'New Delhi', 'Delhi');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (2, 'BCT', 'Mumbai Central Railway Station', 'Mumbai', 'Maharashtra');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (3, 'MAS', 'Chennai Central Railway Station', 'Chennai', 'Tamil Nadu');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (4, 'HWH', 'Howrah Junction Railway Station', 'Kolkata', 'West Bengal');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (5, 'BLR', 'Bangalore City Railway Station', 'Bengaluru', 'Karnataka');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (6, 'JP', 'Jaipur Junction Railway Station', 'Jaipur', 'Rajasthan');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (7, 'ADI', 'Ahmedabad Junction Railway Station', 'Ahmedabad', 'Gujarat');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (8, 'LKO', 'Lucknow Charbagh Railway Station', 'Lucknow', 'Uttar Pradesh');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (9, 'PUNE', 'Pune Junction Railway Station', 'Pune', 'Maharashtra');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (10, 'SBC', 'KSR Bengaluru Cantt Station', 'Bengaluru', 'Karnataka');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (11, 'AGC', 'Agra Cantt Railway Station', 'Agra', 'Uttar Pradesh');

INSERT INTO STATION (station_id, station_code, station_name, city, state)
VALUES (12, 'BPL', 'Bhopal Junction Railway Station', 'Bhopal', 'Madhya Pradesh');

-- ----------------------------------------------------------------------------
-- 3. SEED: TRAIN (10 Operational Trains)
-- ----------------------------------------------------------------------------
PROMPT Populating TRAIN...
INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (1, '12951', 'Mumbai Rajdhani Express', 'Rajdhani', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (2, '12004', 'Lucknow Swarna Shatabdi Express', 'Shatabdi', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (3, '12301', 'Howrah Rajdhani Express', 'Rajdhani', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (4, '12621', 'Tamil Nadu Express', 'Superfast', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (5, '12259', 'Sealdah Bikaner Duronto Express', 'Duronto', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (6, '12002', 'Bhopal Shatabdi Express', 'Shatabdi', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (7, '22691', 'Bangalore Rajdhani Express', 'Rajdhani', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (8, '12953', 'August Kranti Tejas Rajdhani', 'Rajdhani', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (9, '12137', 'Punjab Mail', 'Mail', 'ACTIVE');

INSERT INTO TRAIN (train_id, train_number, train_name, train_type, active_status)
VALUES (10, '12915', 'Ashram Express', 'Express', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 4. SEED: TRAIN_STOP (41 Route Stops)
-- ----------------------------------------------------------------------------
PROMPT Populating TRAIN_STOP...
-- Train 1: 12951 Mumbai Rajdhani (BCT -> ADI -> JP -> NDLS)
INSERT INTO TRAIN_STOP VALUES (1, 1, 2, NULL, '17:00', 0);
INSERT INTO TRAIN_STOP VALUES (1, 2, 7, '23:30', '23:40', 492);
INSERT INTO TRAIN_STOP VALUES (1, 3, 6, '04:15', '04:25', 985);
INSERT INTO TRAIN_STOP VALUES (1, 4, 1, '08:35', NULL, 1384);

-- Train 2: 12004 Lucknow Shatabdi (NDLS -> AGC -> LKO)
INSERT INTO TRAIN_STOP VALUES (2, 1, 1, NULL, '06:10', 0);
INSERT INTO TRAIN_STOP VALUES (2, 2, 11, '07:50', '07:55', 195);
INSERT INTO TRAIN_STOP VALUES (2, 3, 8, '12:40', NULL, 511);

-- Train 3: 12301 Howrah Rajdhani (HWH -> LKO -> NDLS)
INSERT INTO TRAIN_STOP VALUES (3, 1, 4, NULL, '16:50', 0);
INSERT INTO TRAIN_STOP VALUES (3, 2, 8, '04:45', '04:55', 980);
INSERT INTO TRAIN_STOP VALUES (3, 3, 1, '10:05', NULL, 1445);

-- Train 4: 12621 Tamil Nadu Express (MAS -> BPL -> AGC -> NDLS)
INSERT INTO TRAIN_STOP VALUES (4, 1, 3, NULL, '22:00', 0);
INSERT INTO TRAIN_STOP VALUES (4, 2, 12, '15:20', '15:30', 1485);
INSERT INTO TRAIN_STOP VALUES (4, 3, 11, '02:00', '02:05', 1990);
INSERT INTO TRAIN_STOP VALUES (4, 4, 1, '06:30', NULL, 2185);

-- Train 5: 12259 Duronto (NDLS -> JP -> ADI)
INSERT INTO TRAIN_STOP VALUES (5, 1, 1, NULL, '12:00', 0);
INSERT INTO TRAIN_STOP VALUES (5, 2, 6, '16:30', '16:40', 308);
INSERT INTO TRAIN_STOP VALUES (5, 3, 7, '23:55', NULL, 930);

-- Train 6: 12002 Bhopal Shatabdi (NDLS -> AGC -> BPL)
INSERT INTO TRAIN_STOP VALUES (6, 1, 1, NULL, '06:00', 0);
INSERT INTO TRAIN_STOP VALUES (6, 2, 11, '07:50', '07:55', 195);
INSERT INTO TRAIN_STOP VALUES (6, 3, 12, '14:05', NULL, 707);

-- Train 7: 22691 Bangalore Rajdhani (BLR -> BPL -> AGC -> NDLS)
INSERT INTO TRAIN_STOP VALUES (7, 1, 5, NULL, '20:00', 0);
INSERT INTO TRAIN_STOP VALUES (7, 2, 12, '18:20', '18:30', 1660);
INSERT INTO TRAIN_STOP VALUES (7, 3, 11, '02:15', '02:20', 2165);
INSERT INTO TRAIN_STOP VALUES (7, 4, 1, '05:55', NULL, 2360);

-- Train 8: 12953 August Kranti (BCT -> PUNE -> BPL -> NDLS)
INSERT INTO TRAIN_STOP VALUES (8, 1, 2, NULL, '17:40', 0);
INSERT INTO TRAIN_STOP VALUES (8, 2, 9, '21:20', '21:30', 192);
INSERT INTO TRAIN_STOP VALUES (8, 3, 12, '08:10', '08:20', 1080);
INSERT INTO TRAIN_STOP VALUES (8, 4, 1, '16:50', NULL, 1785);

-- Train 9: 12137 Punjab Mail (BCT -> PUNE -> BPL -> AGC -> NDLS)
INSERT INTO TRAIN_STOP VALUES (9, 1, 2, NULL, '19:35', 0);
INSERT INTO TRAIN_STOP VALUES (9, 2, 9, '23:25', '23:35', 192);
INSERT INTO TRAIN_STOP VALUES (9, 3, 12, '10:15', '10:25', 1080);
INSERT INTO TRAIN_STOP VALUES (9, 4, 11, '17:40', '17:45', 1585);
INSERT INTO TRAIN_STOP VALUES (9, 5, 1, '21:30', NULL, 1780);

-- Train 10: 12915 Ashram Express (ADI -> JP -> NDLS)
INSERT INTO TRAIN_STOP VALUES (10, 1, 7, NULL, '19:15', 0);
INSERT INTO TRAIN_STOP VALUES (10, 2, 6, '04:20', '04:30', 625);
INSERT INTO TRAIN_STOP VALUES (10, 3, 1, '10:00', NULL, 933);

-- ----------------------------------------------------------------------------
-- 5. SEED: TRAIN_SCHEDULE (16 Schedules - Dynamic dates based on SYSDATE)
-- ----------------------------------------------------------------------------
PROMPT Populating TRAIN_SCHEDULE...
INSERT INTO TRAIN_SCHEDULE VALUES (1, 1, TRUNC(SYSDATE)+1, TRUNC(SYSDATE)+1 + 17/24, TRUNC(SYSDATE)+2 + 8.5/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (2, 1, TRUNC(SYSDATE)+3, TRUNC(SYSDATE)+3 + 17/24, TRUNC(SYSDATE)+4 + 8.5/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (3, 2, TRUNC(SYSDATE)+1, TRUNC(SYSDATE)+1 + 6.167/24, TRUNC(SYSDATE)+1 + 12.667/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (4, 2, TRUNC(SYSDATE)+2, TRUNC(SYSDATE)+2 + 6.167/24, TRUNC(SYSDATE)+2 + 12.667/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (5, 3, TRUNC(SYSDATE)+1, TRUNC(SYSDATE)+1 + 16.833/24, TRUNC(SYSDATE)+2 + 10.083/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (6, 3, TRUNC(SYSDATE)+4, TRUNC(SYSDATE)+4 + 16.833/24, TRUNC(SYSDATE)+5 + 10.083/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (7, 4, TRUNC(SYSDATE)+2, TRUNC(SYSDATE)+2 + 22/24, TRUNC(SYSDATE)+4 + 6.5/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (8, 5, TRUNC(SYSDATE)+3, TRUNC(SYSDATE)+3 + 12/24, TRUNC(SYSDATE)+3 + 23.917/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (9, 6, TRUNC(SYSDATE)+1, TRUNC(SYSDATE)+1 + 6/24, TRUNC(SYSDATE)+1 + 14.083/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (10, 6, TRUNC(SYSDATE)+5, TRUNC(SYSDATE)+5 + 6/24, TRUNC(SYSDATE)+5 + 14.083/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (11, 7, TRUNC(SYSDATE)+2, TRUNC(SYSDATE)+2 + 20/24, TRUNC(SYSDATE)+4 + 5.917/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (12, 8, TRUNC(SYSDATE)+3, TRUNC(SYSDATE)+3 + 17.667/24, TRUNC(SYSDATE)+4 + 16.833/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (13, 9, TRUNC(SYSDATE)+1, TRUNC(SYSDATE)+1 + 19.583/24, TRUNC(SYSDATE)+2 + 21.5/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (14, 10, TRUNC(SYSDATE)+2, TRUNC(SYSDATE)+2 + 19.25/24, TRUNC(SYSDATE)+3 + 10/24, 'SCHEDULED');
INSERT INTO TRAIN_SCHEDULE VALUES (15, 1, TRUNC(SYSDATE)-1, TRUNC(SYSDATE)-1 + 17/24, TRUNC(SYSDATE) + 8.5/24, 'COMPLETED');
INSERT INTO TRAIN_SCHEDULE VALUES (16, 2, TRUNC(SYSDATE), TRUNC(SYSDATE) + 6.167/24, TRUNC(SYSDATE) + 12.667/24, 'RUNNING');

-- ----------------------------------------------------------------------------
-- 6. SEED: SEAT (60 Physical Seats across 10 Trains)
-- ----------------------------------------------------------------------------
PROMPT Populating SEAT...
-- Train 1: Mumbai Rajdhani
INSERT INTO SEAT VALUES (1, 1, 'H1', 1, '1A', 'LOWER');
INSERT INTO SEAT VALUES (2, 1, 'H1', 2, '1A', 'UPPER');
INSERT INTO SEAT VALUES (3, 1, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (4, 1, 'A1', 2, '2A', 'UPPER');
INSERT INTO SEAT VALUES (5, 1, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (6, 1, 'B1', 2, '3A', 'SIDE_LOWER');

-- Train 2: Lucknow Shatabdi
INSERT INTO SEAT VALUES (7, 2, 'E1', 1, 'EC', 'WINDOW');
INSERT INTO SEAT VALUES (8, 2, 'E1', 2, 'EC', 'AISLE');
INSERT INTO SEAT VALUES (9, 2, 'C1', 1, 'CC', 'WINDOW');
INSERT INTO SEAT VALUES (10, 2, 'C1', 2, 'CC', 'AISLE');
INSERT INTO SEAT VALUES (11, 2, 'C2', 1, 'CC', 'WINDOW');
INSERT INTO SEAT VALUES (12, 2, 'C2', 2, 'CC', 'AISLE');

-- Train 3: Howrah Rajdhani
INSERT INTO SEAT VALUES (13, 3, 'H1', 1, '1A', 'LOWER');
INSERT INTO SEAT VALUES (14, 3, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (15, 3, 'A1', 2, '2A', 'UPPER');
INSERT INTO SEAT VALUES (16, 3, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (17, 3, 'B1', 2, '3A', 'MIDDLE');
INSERT INTO SEAT VALUES (18, 3, 'B1', 3, '3A', 'UPPER');

-- Train 4: Tamil Nadu Express
INSERT INTO SEAT VALUES (19, 4, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (20, 4, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (21, 4, 'B1', 2, '3A', 'SIDE_LOWER');
INSERT INTO SEAT VALUES (22, 4, 'S1', 1, 'SL', 'LOWER');
INSERT INTO SEAT VALUES (23, 4, 'S1', 2, 'SL', 'MIDDLE');
INSERT INTO SEAT VALUES (24, 4, 'S1', 3, 'SL', 'UPPER');

-- Train 5: Duronto Express
INSERT INTO SEAT VALUES (25, 5, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (26, 5, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (27, 5, 'B1', 2, '3A', 'MIDDLE');
INSERT INTO SEAT VALUES (28, 5, 'S1', 1, 'SL', 'LOWER');
INSERT INTO SEAT VALUES (29, 5, 'S1', 2, 'SL', 'SIDE_LOWER');
INSERT INTO SEAT VALUES (30, 5, 'S1', 3, 'SL', 'SIDE_UPPER');

-- Train 6: Bhopal Shatabdi
INSERT INTO SEAT VALUES (31, 6, 'E1', 1, 'EC', 'WINDOW');
INSERT INTO SEAT VALUES (32, 6, 'E1', 2, 'EC', 'AISLE');
INSERT INTO SEAT VALUES (33, 6, 'C1', 1, 'CC', 'WINDOW');
INSERT INTO SEAT VALUES (34, 6, 'C1', 2, 'CC', 'AISLE');
INSERT INTO SEAT VALUES (35, 6, 'C2', 1, 'CC', 'WINDOW');
INSERT INTO SEAT VALUES (36, 6, 'C2', 2, 'CC', 'AISLE');

-- Train 7: Bangalore Rajdhani
INSERT INTO SEAT VALUES (37, 7, 'H1', 1, '1A', 'LOWER');
INSERT INTO SEAT VALUES (38, 7, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (39, 7, 'A1', 2, '2A', 'UPPER');
INSERT INTO SEAT VALUES (40, 7, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (41, 7, 'B1', 2, '3A', 'MIDDLE');
INSERT INTO SEAT VALUES (42, 7, 'B1', 3, '3A', 'SIDE_LOWER');

-- Train 8: August Kranti Rajdhani
INSERT INTO SEAT VALUES (43, 8, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (44, 8, 'A1', 2, '2A', 'UPPER');
INSERT INTO SEAT VALUES (45, 8, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (46, 8, 'B1', 2, '3A', 'MIDDLE');
INSERT INTO SEAT VALUES (47, 8, 'B1', 3, '3A', 'UPPER');
INSERT INTO SEAT VALUES (48, 8, 'B1', 4, '3A', 'SIDE_LOWER');

-- Train 9: Punjab Mail
INSERT INTO SEAT VALUES (49, 9, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (50, 9, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (51, 9, 'S1', 1, 'SL', 'LOWER');
INSERT INTO SEAT VALUES (52, 9, 'S1', 2, 'SL', 'MIDDLE');
INSERT INTO SEAT VALUES (53, 9, 'D1', 1, '2S', 'WINDOW');
INSERT INTO SEAT VALUES (54, 9, 'D1', 2, '2S', 'AISLE');

-- Train 10: Ashram Express
INSERT INTO SEAT VALUES (55, 10, 'A1', 1, '2A', 'LOWER');
INSERT INTO SEAT VALUES (56, 10, 'B1', 1, '3A', 'LOWER');
INSERT INTO SEAT VALUES (57, 10, 'S1', 1, 'SL', 'LOWER');
INSERT INTO SEAT VALUES (58, 10, 'S1', 2, 'SL', 'MIDDLE');
INSERT INTO SEAT VALUES (59, 10, 'D1', 1, '2S', 'WINDOW');
INSERT INTO SEAT VALUES (60, 10, 'D1', 2, '2S', 'AISLE');

-- ----------------------------------------------------------------------------
-- 7. SEED: RESERVATION (15 Records)
-- Mix of CONFIRMED, PENDING, and CANCELLED bookings.
-- All route sequences, trains, and non-overlapping active seats are verified.
-- ----------------------------------------------------------------------------
PROMPT Populating RESERVATION...
-- Schedule 1 (Train 1: BCT -> ADI -> JP -> NDLS)
INSERT INTO RESERVATION VALUES (1, 'PNR1000000001', 1, 1, 1, 2, 1, SYSTIMESTAMP - INTERVAL '2' DAY, 'CONFIRMED', 4152.00);
INSERT INTO RESERVATION VALUES (2, 'PNR1000000002', 2, 1, 3, 2, 7, SYSTIMESTAMP - INTERVAL '1' DAY, 'CONFIRMED', 885.60);
INSERT INTO RESERVATION VALUES (3, 'PNR1000000003', 3, 1, 5, 7, 1, SYSTIMESTAMP - INTERVAL '12' HOUR, 'CONFIRMED', 1070.40);

-- Schedule 3 (Train 2: NDLS -> AGC -> LKO)
INSERT INTO RESERVATION VALUES (4, 'PNR1000000004', 4, 3, 7, 1, 8, SYSTIMESTAMP - INTERVAL '3' DAY, 'CONFIRMED', 1277.50);
INSERT INTO RESERVATION VALUES (5, 'PNR1000000005', 5, 3, 9, 1, 11, SYSTIMESTAMP - INTERVAL '2' DAY, 'CONFIRMED', 292.50);

-- Schedule 5 (Train 3: HWH -> LKO -> NDLS)
INSERT INTO RESERVATION VALUES (6, 'PNR1000000006', 6, 5, 13, 4, 1, SYSTIMESTAMP - INTERVAL '4' DAY, 'CONFIRMED', 4335.00);
INSERT INTO RESERVATION VALUES (7, 'PNR1000000007', 7, 5, 16, 4, 8, SYSTIMESTAMP - INTERVAL '1' DAY, 'CONFIRMED', 1176.00);

-- Schedule 7 (Train 4: MAS -> BPL -> AGC -> NDLS)
INSERT INTO RESERVATION VALUES (8, 'PNR1000000008', 8, 7, 22, 3, 1, SYSTIMESTAMP - INTERVAL '5' DAY, 'CONFIRMED', 1092.50);
INSERT INTO RESERVATION VALUES (9, 'PNR1000000009', 9, 7, 20, 3, 12, SYSTIMESTAMP - INTERVAL '3' DAY, 'CONFIRMED', 1782.00);

-- Schedule 9 (Train 6: NDLS -> AGC -> BPL)
INSERT INTO RESERVATION VALUES (10, 'PNR1000000010', 10, 9, 31, 1, 12, SYSTIMESTAMP - INTERVAL '2' DAY, 'CONFIRMED', 1767.50);

-- Schedule 11 (Train 7: BLR -> BPL -> AGC -> NDLS)
INSERT INTO RESERVATION VALUES (11, 'PNR1000000011', 11, 11, 37, 5, 1, SYSTIMESTAMP - INTERVAL '6' DAY, 'CONFIRMED', 7080.00);

-- Schedule 13 (Train 9: BCT -> PUNE -> BPL -> AGC -> NDLS)
INSERT INTO RESERVATION VALUES (12, 'PNR1000000012', 12, 13, 51, 2, 1, SYSTIMESTAMP - INTERVAL '1' DAY, 'CONFIRMED', 890.00);

-- Pending Bookings (Payment failed or awaiting capture)
INSERT INTO RESERVATION VALUES (13, 'PNR1000000013', 13, 1, 2, 2, 1, SYSTIMESTAMP - INTERVAL '10' MINUTE, 'PENDING', 4152.00);
INSERT INTO RESERVATION VALUES (14, 'PNR1000000014', 14, 3, 11, 1, 8, SYSTIMESTAMP - INTERVAL '5' MINUTE, 'PENDING', 766.50);

-- Cancelled Booking (Released seat)
INSERT INTO RESERVATION VALUES (15, 'PNR1000000015', 15, 4, 9, 1, 8, SYSTIMESTAMP - INTERVAL '7' DAY, 'CANCELLED', 766.50);

-- ----------------------------------------------------------------------------
-- 8. SEED: PAYMENT (18 Transactions)
-- Mix of SUCCESS, FAILED, and REFUND_SUCCESS.
-- ----------------------------------------------------------------------------
PROMPT Populating PAYMENT...
-- Successful payments confirming reservations 1 through 12
INSERT INTO PAYMENT VALUES (1, 1, 4152.00, 'UPI', 'SUCCESS', 'TXN000000000001', SYSTIMESTAMP - INTERVAL '2' DAY);
INSERT INTO PAYMENT VALUES (2, 2, 885.60, 'CARD', 'SUCCESS', 'TXN000000000002', SYSTIMESTAMP - INTERVAL '1' DAY);
INSERT INTO PAYMENT VALUES (3, 3, 1070.40, 'NET_BANKING', 'SUCCESS', 'TXN000000000003', SYSTIMESTAMP - INTERVAL '12' HOUR);
INSERT INTO PAYMENT VALUES (4, 4, 1277.50, 'UPI', 'SUCCESS', 'TXN000000000004', SYSTIMESTAMP - INTERVAL '3' DAY);
INSERT INTO PAYMENT VALUES (5, 5, 292.50, 'CARD', 'SUCCESS', 'TXN000000000005', SYSTIMESTAMP - INTERVAL '2' DAY);
INSERT INTO PAYMENT VALUES (6, 6, 4335.00, 'CARD', 'SUCCESS', 'TXN000000000006', SYSTIMESTAMP - INTERVAL '4' DAY);
INSERT INTO PAYMENT VALUES (7, 7, 1176.00, 'UPI', 'SUCCESS', 'TXN000000000007', SYSTIMESTAMP - INTERVAL '1' DAY);
INSERT INTO PAYMENT VALUES (8, 8, 1092.50, 'CASH', 'SUCCESS', 'TXN000000000008', SYSTIMESTAMP - INTERVAL '5' DAY);
INSERT INTO PAYMENT VALUES (9, 9, 1782.00, 'NET_BANKING', 'SUCCESS', 'TXN000000000009', SYSTIMESTAMP - INTERVAL '3' DAY);
INSERT INTO PAYMENT VALUES (10, 10, 1767.50, 'CARD', 'SUCCESS', 'TXN000000000010', SYSTIMESTAMP - INTERVAL '2' DAY);
INSERT INTO PAYMENT VALUES (11, 11, 7080.00, 'CARD', 'SUCCESS', 'TXN000000000011', SYSTIMESTAMP - INTERVAL '6' DAY);
INSERT INTO PAYMENT VALUES (12, 12, 890.00, 'UPI', 'SUCCESS', 'TXN000000000012', SYSTIMESTAMP - INTERVAL '1' DAY);

-- Failed payments for pending reservations
INSERT INTO PAYMENT VALUES (13, 13, 4152.00, 'UPI', 'FAILED', 'TXN000000000013', SYSTIMESTAMP - INTERVAL '10' MINUTE);
INSERT INTO PAYMENT VALUES (14, 14, 766.50, 'CARD', 'FAILED', 'TXN000000000014', SYSTIMESTAMP - INTERVAL '5' MINUTE);

-- Prior successful payment and refund for cancelled reservation 15
INSERT INTO PAYMENT VALUES (15, 15, 766.50, 'UPI', 'SUCCESS', 'TXN000000000015', SYSTIMESTAMP - INTERVAL '7' DAY);
INSERT INTO PAYMENT VALUES (16, 15, 766.50, 'REFUND', 'REFUND_SUCCESS', 'TXN000000000016', SYSTIMESTAMP - INTERVAL '6' DAY);

-- Additional failed retry transactions for audit trail
INSERT INTO PAYMENT VALUES (17, 1, 100.00, 'CARD', 'FAILED', 'TXN000000000017', SYSTIMESTAMP - INTERVAL '2' DAY + INTERVAL '1' MINUTE);
INSERT INTO PAYMENT VALUES (18, 2, 50.00, 'UPI', 'FAILED', 'TXN000000000018', SYSTIMESTAMP - INTERVAL '1' DAY + INTERVAL '2' MINUTE);

COMMIT;

-- ----------------------------------------------------------------------------
-- 9. DYNAMIC SEQUENCE SYNCHRONIZATION
-- Advance sequences so that subsequent calls to .NEXTVAL return valid keys above MAX(id).
-- ----------------------------------------------------------------------------
PROMPT Synchronizing Sequences with Inserted Seed IDs...
DECLARE
    PROCEDURE reset_sequence(p_seq_name VARCHAR2, p_table VARCHAR2, p_col VARCHAR2) IS
        v_max_id NUMBER := 0;
        v_dummy  NUMBER;
    BEGIN
        EXECUTE IMMEDIATE 'SELECT NVL(MAX(' || p_col || '), 0) FROM ' || p_table INTO v_max_id;
        IF v_max_id > 0 THEN
            BEGIN
                EXECUTE IMMEDIATE 'DROP SEQUENCE ' || p_seq_name;
            EXCEPTION
                WHEN OTHERS THEN NULL;
            END;
            EXECUTE IMMEDIATE 'CREATE SEQUENCE ' || p_seq_name || ' START WITH ' || (v_max_id + 1) || 
                              ' INCREMENT BY 1 NOMAXVALUE NOCACHE NOCYCLE';
            DBMS_OUTPUT.PUT_LINE('  [SYNCED] ' || p_seq_name || ' set to start with ' || (v_max_id + 1));
        END IF;
    END;
BEGIN
    reset_sequence('SEQ_PASSENGER_ID',   'PASSENGER',      'passenger_id');
    reset_sequence('SEQ_STATION_ID',     'STATION',        'station_id');
    reset_sequence('SEQ_TRAIN_ID',       'TRAIN',          'train_id');
    reset_sequence('SEQ_SCHEDULE_ID',    'TRAIN_SCHEDULE', 'schedule_id');
    reset_sequence('SEQ_SEAT_ID',        'SEAT',           'seat_id');
    reset_sequence('SEQ_RESERVATION_ID', 'RESERVATION',    'reservation_id');
    reset_sequence('SEQ_PAYMENT_ID',     'PAYMENT',        'payment_id');

    -- Reset SEQ_PNR (numeric part starting from 1000000000 + max offset)
    BEGIN
        DECLARE
            v_max_pnr_num NUMBER := 1000000000;
        BEGIN
            SELECT NVL(MAX(TO_NUMBER(SUBSTR(pnr, 4))), 1000000000)
            INTO v_max_pnr_num
            FROM RESERVATION
            WHERE REGEXP_LIKE(pnr, '^PNR[0-9]+$');
            
            BEGIN
                EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_PNR';
            EXCEPTION WHEN OTHERS THEN NULL; END;

            EXECUTE IMMEDIATE 'CREATE SEQUENCE SEQ_PNR START WITH ' || (v_max_pnr_num + 1) || 
                              ' INCREMENT BY 1 NOMAXVALUE NOCACHE NOCYCLE';
            DBMS_OUTPUT.PUT_LINE('  [SYNCED] SEQ_PNR set to start with ' || (v_max_pnr_num + 1));
        END;
    END;

    -- Reset SEQ_TXN_REF
    BEGIN
        DECLARE
            v_max_txn_num NUMBER := 0;
        BEGIN
            SELECT NVL(MAX(TO_NUMBER(SUBSTR(transaction_reference, 4))), 0)
            INTO v_max_txn_num
            FROM PAYMENT
            WHERE REGEXP_LIKE(transaction_reference, '^TXN[0-9]+$');

            BEGIN
                EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_TXN_REF';
            EXCEPTION WHEN OTHERS THEN NULL; END;

            EXECUTE IMMEDIATE 'CREATE SEQUENCE SEQ_TXN_REF START WITH ' || (v_max_txn_num + 1) || 
                              ' INCREMENT BY 1 NOMAXVALUE NOCACHE NOCYCLE';
            DBMS_OUTPUT.PUT_LINE('  [SYNCED] SEQ_TXN_REF set to start with ' || (v_max_txn_num + 1));
        END;
    END;
END;
/

PROMPT ============================================================================
PROMPT Seed Data Insertion and Sequence Sync Complete.
PROMPT ============================================================================
