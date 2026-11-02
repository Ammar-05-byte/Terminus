# Entity-Relationship (ER) Diagram & Model Specification

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/ER_DIAGRAM.md`  

---

## 1. Complete System Entity-Relationship Diagram

The ER diagram below models the complete relational architecture of the **Terminus Railway Reservation System**, comprising all **8 core entities**, their primary and foreign keys, candidate unique keys, and all **10 structural relationships** with exact Crow's Foot cardinalities.

```mermaid
erDiagram
    PASSENGER {
        NUMBER passenger_id PK
        VARCHAR2 full_name
        DATE date_of_birth
        VARCHAR2 gender
        VARCHAR2 phone UK
        VARCHAR2 email UK
    }
    STATION {
        NUMBER station_id PK
        VARCHAR2 station_code UK
        VARCHAR2 station_name
        VARCHAR2 city
        VARCHAR2 state
    }
    TRAIN {
        NUMBER train_id PK
        VARCHAR2 train_number UK
        VARCHAR2 train_name
        VARCHAR2 train_type
        VARCHAR2 active_status
    }
    TRAIN_STOP {
        NUMBER train_id PK_FK
        NUMBER stop_sequence PK
        NUMBER station_id FK
        VARCHAR2 arrival_time
        VARCHAR2 departure_time
        NUMBER distance_from_origin_km
    }
    TRAIN_SCHEDULE {
        NUMBER schedule_id PK
        NUMBER train_id FK
        DATE journey_date
        TIMESTAMP scheduled_departure
        TIMESTAMP scheduled_arrival
        VARCHAR2 schedule_status
    }
    SEAT {
        NUMBER seat_id PK
        NUMBER train_id FK
        VARCHAR2 coach_number
        NUMBER seat_number
        VARCHAR2 coach_class
        VARCHAR2 berth_type
    }
    RESERVATION {
        NUMBER reservation_id PK
        VARCHAR2 pnr UK
        NUMBER passenger_id FK
        NUMBER schedule_id FK
        NUMBER seat_id FK
        NUMBER source_station_id FK
        NUMBER destination_station_id FK
        TIMESTAMP booking_timestamp
        VARCHAR2 booking_status
        NUMBER fare_amount
    }
    PAYMENT {
        NUMBER payment_id PK
        NUMBER reservation_id FK
        NUMBER amount
        VARCHAR2 payment_method
        VARCHAR2 payment_status
        VARCHAR2 transaction_reference UK
        TIMESTAMP payment_timestamp
    }
    PASSENGER ||--o{ RESERVATION : "books"
    TRAIN ||--o{ TRAIN_STOP : "has stops"
    STATION ||--o{ TRAIN_STOP : "served by"
    TRAIN ||--o{ TRAIN_SCHEDULE : "scheduled as"
    TRAIN ||--o{ SEAT : "has seats"
    TRAIN_SCHEDULE ||--o{ RESERVATION : "booked for"
    SEAT ||--o{ RESERVATION : "allocated to"
    STATION ||--o{ RESERVATION : "source station"
    STATION ||--o{ RESERVATION : "destination station"
    RESERVATION ||--o{ PAYMENT : "paid via"
```

---

## 2. Comprehensive Relationship Catalog & Cardinality Rationale

The database contains **10 direct relational associations**. Each association enforces specific referential integrity rules and multiplicity constraints:

| Rel # | Parent Entity | Child Entity | Foreign Key Column | Cardinality | Participation | Referential Action | Semantic Business Rule |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **R-01** | `PASSENGER` | `RESERVATION` | `passenger_id` | $1 : N$ (One-to-Many) | Mandatory in Child, Optional in Parent | `RESTRICT` (Default) | A passenger may place zero, one, or multiple reservations over time; each reservation must belong to exactly one registered passenger. |
| **R-02** | `TRAIN` | `TRAIN_STOP` | `train_id` | $1 : N$ (One-to-Many) | Mandatory in both | `ON DELETE CASCADE` | A train must have two or more scheduled stops along its route; deleting a train removes its entire route itinerary. |
| **R-03** | `STATION` | `TRAIN_STOP` | `station_id` | $1 : N$ (One-to-Many) | Mandatory in Child, Optional in Parent | `RESTRICT` (Default) | A railway station serves as an origin, intermediate halt, or terminus for zero, one, or many train services. |
| **R-04** | `TRAIN` | `TRAIN_SCHEDULE` | `train_id` | $1 : N$ (One-to-Many) | Mandatory in Child, Optional in Parent | `ON DELETE CASCADE` | A train service is scheduled for calendar runs across multiple journey dates. |
| **R-05** | `TRAIN` | `SEAT` | `train_id` | $1 : N$ (One-to-Many) | Mandatory in both | `ON DELETE CASCADE` | A train rake contains a physical inventory of many seats partitioned across coaches; deleting a train deletes its seat layout. |
| **R-06** | `TRAIN_SCHEDULE` | `RESERVATION` | `schedule_id` | $1 : N$ (One-to-Many) | Mandatory in Child, Optional in Parent | `RESTRICT` (Default) | A calendar train schedule receives multiple passenger ticket reservations. |
| **R-07** | `SEAT` | `RESERVATION` | `seat_id` | $1 : N$ (One-to-Many) | Optional in Child, Optional in Parent | `RESTRICT` (Default) | A physical seat may be booked across multiple historical or future schedules, but can have only one active booking per schedule (enforced by `IDX_ACTIVE_SEAT_RESERVATION`). |
| **R-08** | `STATION` | `RESERVATION` | `source_station_id` | $1 : N$ (One-to-Many) | Mandatory in Child, Optional in Parent | `RESTRICT` (Default) | A station acts as the boarding (source) location for multiple passenger reservations. |
| **R-09** | `STATION` | `RESERVATION` | `destination_station_id` | $1 : N$ (One-to-Many) | Mandatory in Child, Optional in Parent | `RESTRICT` (Default) | A station acts as the deboarding (destination) location for multiple passenger reservations. |
| **R-10** | `RESERVATION` | `PAYMENT` | `reservation_id` | $1 : N$ (One-to-Many) | Mandatory in Child, Optional in Parent | `RESTRICT` (Default) | A reservation tracks one or more financial transactions (e.g., initial charge, payment retries, or subsequent refund). |

---

## 3. Structural Analysis of Cardinalities & Dependencies

### 3.1 Composite Weak Entity: `TRAIN_STOP`
The entity `TRAIN_STOP` exhibits characteristics of an ID-dependent weak entity relative to `TRAIN`:
- Its primary key is composite: `(train_id, stop_sequence)`.
- It cannot exist independently of a valid parent `TRAIN`.
- The referential constraint `ON DELETE CASCADE` ensures that decommissioning a train purge its ordered station itinerary automatically.

### 3.2 Dual Foreign Key Association: `STATION` to `RESERVATION`
The `RESERVATION` entity possesses two distinct foreign keys pointing to the same parent table `STATION`:
1. `source_station_id REFERENCES STATION(station_id)`
2. `destination_station_id REFERENCES STATION(station_id)`

This dual relationship is governed by check constraint `chk_res_src_dest`:
$$\text{source\_station\_id} \ne \text{destination\_station\_id}$$
and trigger `TRG_VALIDATE_RESERVATION`, which validates that both stations exist on the train's registered route and that the boarding stop sequence strictly precedes the destination stop sequence ($Seq_{src} < Seq_{dest}$).

### 3.3 Sparse Uniqueness: `SEAT` to `RESERVATION`
Although the relationship between `SEAT` and `RESERVATION` is structurally $1:N$ (allowing historical audit logs across different dates and cancelled bookings), active concurrency requires an effective $1:1$ cardinality for any specific `schedule_id`. This is enforced via the function-based unique index `IDX_ACTIVE_SEAT_RESERVATION`, which guarantees that for any given `(schedule_id, seat_id)`, at most one record can exist with status `PENDING` or `CONFIRMED`.
