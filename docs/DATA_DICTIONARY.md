# Enterprise Data Dictionary

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/DATA_DICTIONARY.md`  

---

## 1. Data Dictionary Overview

This document provides the definitive data dictionary for the **Terminus Railway Reservation System**. For each of the **8 relational tables**, the specification lists the column name, physical Oracle data type, storage size/precision, nullability, default values, applied constraints, and detailed semantic descriptions.

---

## 2. Table-by-Table Data Dictionary

---

### 2.1 Table Name: `PASSENGER`
- **Description:** Stores registered passenger profiles, personal demographic details, and unique contact identifiers.
- **Primary Key:** `passenger_id`
- **Oracle Sequence:** `SEQ_PASSENGER_ID` (Starts at 1, Increment 1)

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `passenger_id` | `NUMBER` | 38 | No | — | `pk_passenger` (PK) | Unique surrogate primary key identifying the passenger profile. |
| `full_name` | `VARCHAR2` | 100 | No | — | — | Full legal name of the passenger. |
| `date_of_birth` | `DATE` | 7 bytes | No | — | — | Passenger calendar birth date used for age verification and concession logic. |
| `gender` | `VARCHAR2` | 10 | No | — | `chk_passenger_gender` | Passenger gender; must be `'Male'`, `'Female'`, or `'Other'`. |
| `phone` | `VARCHAR2` | 15 | No | — | `uq_passenger_phone` | Unique mobile telephone number including country dialing prefix. |
| `email` | `VARCHAR2` | 100 | No | — | `uq_passenger_email` | Unique primary electronic mail contact address. |

---

### 2.2 Table Name: `STATION`
- **Description:** Master registry of physical railway junction stations, terminal halts, and geographic locations.
- **Primary Key:** `station_id`
- **Oracle Sequence:** `SEQ_STATION_ID` (Starts at 1, Increment 1)

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `station_id` | `NUMBER` | 38 | No | — | `pk_station` (PK) | Unique surrogate primary key identifying the railway station. |
| `station_code` | `VARCHAR2` | 10 | No | — | `uq_station_code` | Official Indian Railways uppercase alphanumeric station code (e.g., `NDLS`, `BCT`, `MAS`). |
| `station_name` | `VARCHAR2` | 100 | No | — | — | Standard full official name of the railway station. |
| `city` | `VARCHAR2` | 50 | No | — | — | Municipal city location of the station facility. |
| `state` | `VARCHAR2` | 50 | No | — | — | State or territorial jurisdiction of the station. |

---

### 2.3 Table Name: `TRAIN`
- **Description:** Master catalog of train services operating across the national network, tracking classifications and operational lifecycles.
- **Primary Key:** `train_id`
- **Oracle Sequence:** `SEQ_TRAIN_ID` (Starts at 1, Increment 1)

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `train_id` | `NUMBER` | 38 | No | — | `pk_train` (PK) | Unique surrogate primary key identifying the train service. |
| `train_number` | `VARCHAR2` | 10 | No | — | `uq_train_number` | Official 5-digit Indian Railways train identification number. |
| `train_name` | `VARCHAR2` | 100 | No | — | — | Operational commercial name of the train service (e.g., `Mumbai Rajdhani Express`). |
| `train_type` | `VARCHAR2` | 30 | No | — | `chk_train_type` | Category: `Express`, `Superfast`, `Rajdhani`, `Shatabdi`, `Duronto`, `Local`, `Mail`. |
| `active_status` | `VARCHAR2` | 10 | No | `'ACTIVE'` | `chk_train_status` | Current operational state; must be `'ACTIVE'` or `'INACTIVE'`. |

---

### 2.4 Table Name: `TRAIN_STOP`
- **Description:** Ordered route itinerary and intermediate stopping timetable defining sequential station halts and cumulative distances.
- **Primary Key:** Composite `(train_id, stop_sequence)`
- **Foreign Keys:** `train_id` $\rightarrow$ `TRAIN`, `station_id` $\rightarrow$ `STATION`

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `train_id` | `NUMBER` | 38 | No | — | `pk_train_stop`, `fk_stop_train` | Foreign key referencing parent `TRAIN(train_id)` with `ON DELETE CASCADE`. |
| `stop_sequence` | `NUMBER` | 38 | No | — | `pk_train_stop` | 1-based sequential stop ordering along the route (Origin = 1). |
| `station_id` | `NUMBER` | 38 | No | — | `fk_stop_station`, `uq_train_stop_station` | Foreign key referencing physical `STATION(station_id)`. |
| `arrival_time` | `VARCHAR2` | 5 | Yes | — | — | Scheduled 24-hr arrival time string formatted as `HH24:MI`; NULL at route origin. |
| `departure_time` | `VARCHAR2` | 5 | Yes | — | — | Scheduled 24-hr departure time string formatted as `HH24:MI`; NULL at final terminus. |
| `distance_from_origin_km` | `NUMBER` | 38 | No | — | `chk_stop_dist` | Cumulative rail track distance from origin station in kilometers ($\ge 0$). |

---

### 2.5 Table Name: `TRAIN_SCHEDULE`
- **Description:** Calendar-specific run instances of scheduled train services linking train sets to departure dates.
- **Primary Key:** `schedule_id`
- **Foreign Keys:** `train_id` $\rightarrow$ `TRAIN`
- **Oracle Sequence:** `SEQ_SCHEDULE_ID` (Starts at 1, Increment 1)

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `schedule_id` | `NUMBER` | 38 | No | — | `pk_train_schedule` (PK) | Unique surrogate primary key identifying the calendar trip schedule. |
| `train_id` | `NUMBER` | 38 | No | — | `fk_sched_train`, `uq_train_schedule` | Foreign key referencing parent `TRAIN(train_id)` with `ON DELETE CASCADE`. |
| `journey_date` | `DATE` | 7 bytes | No | — | `uq_train_schedule` | Calendar date of departure from route origin station. |
| `scheduled_departure` | `TIMESTAMP` | 11 bytes | No | — | — | Exact scheduled departure timestamp from origin station. |
| `scheduled_arrival` | `TIMESTAMP` | 11 bytes | No | — | — | Exact scheduled arrival timestamp at final terminus station. |
| `schedule_status` | `VARCHAR2` | 20 | No | `'SCHEDULED'` | `chk_sched_status` | Trip status: `'SCHEDULED'`, `'RUNNING'`, `'COMPLETED'`, `'CANCELLED'`. |

---

### 2.6 Table Name: `SEAT`
- **Description:** Physical seat and berth inventory layout configured per train rake.
- **Primary Key:** `seat_id`
- **Foreign Keys:** `train_id` $\rightarrow$ `TRAIN`
- **Oracle Sequence:** `SEQ_SEAT_ID` (Starts at 1, Increment 1)

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `seat_id` | `NUMBER` | 38 | No | — | `pk_seat` (PK) | Unique surrogate primary key identifying the physical seat unit. |
| `train_id` | `NUMBER` | 38 | No | — | `fk_seat_train`, `uq_train_coach_seat` | Foreign key referencing parent `TRAIN(train_id)` with `ON DELETE CASCADE`. |
| `coach_number` | `VARCHAR2` | 10 | No | — | `uq_train_coach_seat` | Alphanumeric coach label (e.g., `S1`, `B1`, `A1`, `H1`, `C1`, `D1`). |
| `seat_number` | `NUMBER` | 38 | No | — | `uq_train_coach_seat` | Integer sequence number of seat/berth inside the coach. |
| `coach_class` | `VARCHAR2` | 10 | No | — | `chk_seat_class` | Travel class: `SL`, `3A`, `2A`, `1A`, `CC`, `2S`, `EC`. |
| `berth_type` | `VARCHAR2` | 10 | Yes | — | `chk_seat_berth` | Berth layout: `LOWER`, `MIDDLE`, `UPPER`, `SIDE_LOWER`, `SIDE_UPPER`, `WINDOW`, `AISLE`, `NA`. |

---

### 2.7 Table Name: `RESERVATION`
- **Description:** Passenger ticket reservations, allocated seats, station pairs, and booking lifecycle states.
- **Primary Key:** `reservation_id`
- **Foreign Keys:** `passenger_id`, `schedule_id`, `seat_id`, `source_station_id`, `destination_station_id`
- **Oracle Sequences:** `SEQ_RESERVATION_ID` (Starts at 1), `SEQ_PNR` (Starts at 1000000001)

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `reservation_id` | `NUMBER` | 38 | No | — | `pk_reservation` (PK) | Unique surrogate primary key identifying the reservation record. |
| `pnr` | `VARCHAR2` | 15 | No | — | `uq_reservation_pnr` | Unique 10-12 character Passenger Name Record tracking identifier. |
| `passenger_id` | `NUMBER` | 38 | No | — | `fk_res_passenger` | Foreign key referencing `PASSENGER(passenger_id)`. |
| `schedule_id` | `NUMBER` | 38 | No | — | `fk_res_schedule` | Foreign key referencing `TRAIN_SCHEDULE(schedule_id)`. |
| `seat_id` | `NUMBER` | 38 | Yes | — | `fk_res_seat` | Foreign key referencing allocated `SEAT(seat_id)` (nullable for waitlist/hold). |
| `source_station_id` | `NUMBER` | 38 | No | — | `fk_res_src`, `chk_res_src_dest` | Foreign key referencing boarding `STATION(station_id)`. |
| `destination_station_id`| `NUMBER` | 38 | No | — | `fk_res_dest`, `chk_res_src_dest`| Foreign key referencing deboarding `STATION(station_id)`. |
| `booking_timestamp` | `TIMESTAMP` | 11 bytes | No | `SYSTIMESTAMP` | — | Exact database system timestamp when the reservation was created. |
| `booking_status` | `VARCHAR2` | 20 | No | `'PENDING'` | `chk_res_status` | Booking lifecycle status: `'PENDING'`, `'CONFIRMED'`, `'CANCELLED'`, `'EXPIRED'`. |
| `fare_amount` | `NUMBER` | (10,2) | Yes | — | `chk_res_fare` | Total computed ticket fare in INR ($\ge 0$). |

---

### 2.8 Table Name: `PAYMENT`
- **Description:** Financial transaction records, gateway payment settlements, and refund audit ledgers.
- **Primary Key:** `payment_id`
- **Foreign Keys:** `reservation_id` $\rightarrow$ `RESERVATION`
- **Oracle Sequences:** `SEQ_PAYMENT_ID` (Starts at 1), `SEQ_TXN_REF` (Starts at 1000000001)

| Column Name | Data Type | Size | Nullable | Default | Constraint | Description |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `payment_id` | `NUMBER` | 38 | No | — | `pk_payment` (PK) | Unique surrogate primary key identifying the financial payment record. |
| `reservation_id` | `NUMBER` | 38 | No | — | `fk_pay_reservation` | Foreign key referencing parent `RESERVATION(reservation_id)`. |
| `amount` | `NUMBER` | (10,2) | No | — | `chk_pay_amount` | Monetary transaction amount in INR ($\ge 0$). |
| `payment_method` | `VARCHAR2` | 20 | No | — | `chk_pay_method` | Payment channel: `'UPI'`, `'CARD'`, `'NET_BANKING'`, `'CASH'`, `'REFUND'`. |
| `payment_status` | `VARCHAR2` | 20 | No | — | `chk_pay_status` | Gateway status: `'SUCCESS'`, `'FAILED'`, `'REFUND_SUCCESS'`. |
| `transaction_reference`| `VARCHAR2` | 50 | No | — | `uq_pay_txn_ref` | Unique gateway transaction reference token (e.g., `TXN000000000001`). |
| `payment_timestamp` | `TIMESTAMP` | 11 bytes | No | `SYSTIMESTAMP` | — | Exact database system timestamp when transaction was recorded. |
