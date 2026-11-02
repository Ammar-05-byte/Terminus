# Relational Normalization & Functional Dependency Analysis

**Course Code:** BCSE302L — Database Management Systems  
**Project Title:** Terminus: High-Integrity Railway Reservation & Inventory Management System  
**Document Ref:** `docs/NORMALIZATION.md`  

---

## 1. Theoretical Foundations of Relational Normalization

Relational database normalization is the formal mathematical technique of organizing relations to minimize data redundancy and eliminate update, insertion, and deletion anomalies. In accordance with relational database theory taught in **BCSE302L**, a relation is evaluated against four progressive normal forms:

```mermaid
flowchart LR
    1NF["1NF\n(Atomic Attributes)"] --> 2NF["2NF\n(No Partial Dependencies)"]
    2NF --> 3NF["3NF\n(No Transitive Dependencies)"]
    3NF --> BCNF["BCNF\n(Determinants are Superkeys)"]
```

### Formal Criteria Definitions
1. **First Normal Form (1NF):** A relation $R$ is in 1NF if and only if all domain values are atomic (indivisible scalars) and there are no repeating groups or multivalued attributes.
2. **Second Normal Form (2NF):** A relation $R$ is in 2NF if and only if it is in 1NF and no non-prime attribute is functionally dependent on any proper subset of any candidate key (no *partial functional dependencies*).
3. **Third Normal Form (3NF):** A relation $R$ is in 3NF if and only if it is in 2NF and for every non-trivial functional dependency $X \longrightarrow Y$, either:
   - $X$ is a superkey of $R$, **OR**
   - $Y$ is a prime attribute (a member of some candidate key).
4. **Boyce-Codd Normal Form (BCNF):** A relation $R$ is in BCNF if and only if for every non-trivial functional dependency $X \longrightarrow Y$, $X$ is a **superkey** of $R$.

---

## 2. Table-by-Table Normalization & Functional Dependency Proofs

---

### 2.1 Relation: `PASSENGER`
- **Attribute Set:** $\{\text{passenger\_id}, \text{full\_name}, \text{date\_of\_birth}, \text{gender}, \text{phone}, \text{email}\}$
- **Candidate Keys:** $CK_1 = \{\text{passenger\_id}\}$, $CK_2 = \{\text{phone}\}$, $CK_3 = \{\text{email}\}$
- **Prime Attributes:** $\{\text{passenger\_id}, \text{phone}, \text{email}\}$
- **Non-Prime Attributes:** $\{\text{full\_name}, \text{date\_of\_birth}, \text{gender}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{passenger\_id}\} \longrightarrow \{\text{full\_name}, \text{date\_of\_birth}, \text{gender}, \text{phone}, \text{email}\}$
2. $FD_2: \{\text{phone}\} \longrightarrow \{\text{passenger\_id}, \text{full\_name}, \text{date\_of\_birth}, \text{gender}, \text{email}\}$
3. $FD_3: \{\text{email}\} \longrightarrow \{\text{passenger\_id}, \text{full\_name}, \text{date\_of\_birth}, \text{gender}, \text{phone}\}$

#### Normal Form Evaluation:
- **1NF:** Satisfied. All attributes contain atomic scalar values.
- **2NF:** Satisfied. All candidate keys are single-attribute; partial dependencies cannot exist.
- **3NF:** Satisfied. Every determinant ($\{\text{passenger\_id}\}$, $\{\text{phone}\}$, $\{\text{email}\}$) is a superkey.
- **BCNF:** **Satisfied.** Every determinant in every non-trivial functional dependency is a superkey.
- **Conclusion:** `PASSENGER` is in **BCNF**.

---

### 2.2 Relation: `STATION`
- **Attribute Set:** $\{\text{station\_id}, \text{station\_code}, \text{station\_name}, \text{city}, \text{state}\}$
- **Candidate Keys:** $CK_1 = \{\text{station\_id}\}$, $CK_2 = \{\text{station\_code}\}$
- **Prime Attributes:** $\{\text{station\_id}, \text{station\_code}\}$
- **Non-Prime Attributes:** $\{\text{station\_name}, \text{city}, \text{state}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{station\_id}\} \longrightarrow \{\text{station\_code}, \text{station\_name}, \text{city}, \text{state}\}$
2. $FD_2: \{\text{station\_code}\} \longrightarrow \{\text{station\_id}, \text{station\_name}, \text{city}, \text{state}\}$

#### Normal Form Evaluation:
- **1NF:** Satisfied. All values are atomic.
- **2NF:** Satisfied. Candidate keys are single-attribute; no partial dependencies.
- **3NF:** Satisfied. Determinants are superkeys.
- **BCNF:** **Satisfied.** Every determinant is a candidate key / superkey.
- **Conclusion:** `STATION` is in **BCNF**.

---

### 2.3 Relation: `TRAIN`
- **Attribute Set:** $\{\text{train\_id}, \text{train\_number}, \text{train\_name}, \text{train\_type}, \text{active\_status}\}$
- **Candidate Keys:** $CK_1 = \{\text{train\_id}\}$, $CK_2 = \{\text{train\_number}\}$
- **Prime Attributes:** $\{\text{train\_id}, \text{train\_number}\}$
- **Non-Prime Attributes:** $\{\text{train\_name}, \text{train\_type}, \text{active\_status}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{train\_id}\} \longrightarrow \{\text{train\_number}, \text{train\_name}, \text{train\_type}, \text{active\_status}\}$
2. $FD_2: \{\text{train\_number}\} \longrightarrow \{\text{train\_id}, \text{train\_name}, \text{train\_type}, \text{active\_status}\}$

#### Normal Form Evaluation:
- **1NF:** Satisfied. Atomic fields only.
- **2NF:** Satisfied. No composite candidate keys; no partial dependencies.
- **3NF:** Satisfied. No transitive dependencies.
- **BCNF:** **Satisfied.** Determinants are superkeys.
- **Conclusion:** `TRAIN` is in **BCNF**.

---

### 2.4 Relation: `TRAIN_STOP`
- **Attribute Set:** $\{\text{train\_id}, \text{stop\_sequence}, \text{station\_id}, \text{arrival\_time}, \text{departure\_time}, \text{distance\_from\_origin\_km}\}$
- **Candidate Keys:** 
  - $CK_1 = \{\text{train\_id}, \text{stop\_sequence}\}$
  - $CK_2 = \{\text{train\_id}, \text{station\_id}\}$
- **Prime Attributes:** $\{\text{train\_id}, \text{stop\_sequence}, \text{station\_id}\}$
- **Non-Prime Attributes:** $\{\text{arrival\_time}, \text{departure\_time}, \text{distance\_from\_origin\_km}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{train\_id}, \text{stop\_sequence}\} \longrightarrow \{\text{station\_id}, \text{arrival\_time}, \text{departure\_time}, \text{distance\_from\_origin\_km}\}$
2. $FD_2: \{\text{train\_id}, \text{station\_id}\} \longrightarrow \{\text{stop\_sequence}, \text{arrival\_time}, \text{departure\_time}, \text{distance\_from\_origin\_km}\}$

#### Normal Form Evaluation:
- **1NF:** Satisfied. All attributes contain scalar values.
- **2NF:** Satisfied. No non-prime attribute depends on a proper subset of either candidate key (e.g., neither `train_id` alone nor `stop_sequence` alone determines `arrival_time`).
- **3NF:** Satisfied. All determinants are candidate keys.
- **BCNF:** **Satisfied.** Both $FD_1$ and $FD_2$ have left-hand sides that are valid superkeys.
- **Conclusion:** `TRAIN_STOP` is in **BCNF**.

---

### 2.5 Relation: `TRAIN_SCHEDULE`
- **Attribute Set:** $\{\text{schedule\_id}, \text{train\_id}, \text{journey\_date}, \text{scheduled\_departure}, \text{scheduled\_arrival}, \text{schedule\_status}\}$
- **Candidate Keys:** 
  - $CK_1 = \{\text{schedule\_id}\}$
  - $CK_2 = \{\text{train\_id}, \text{journey\_date}\}$
- **Prime Attributes:** $\{\text{schedule\_id}, \text{train\_id}, \text{journey\_date}\}$
- **Non-Prime Attributes:** $\{\text{scheduled\_departure}, \text{scheduled\_arrival}, \text{schedule\_status}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{schedule\_id}\} \longrightarrow \{\text{train\_id}, \text{journey\_date}, \text{scheduled\_departure}, \text{scheduled\_arrival}, \text{schedule\_status}\}$
2. $FD_2: \{\text{train\_id}, \text{journey\_date}\} \longrightarrow \{\text{schedule\_id}, \text{scheduled\_departure}, \text{scheduled\_arrival}, \text{schedule\_status}\}$

#### Normal Form Evaluation:
- **1NF:** Satisfied. Atomic domain types.
- **2NF:** Satisfied. No partial functional dependencies.
- **3NF:** Satisfied. Determinants are superkeys.
- **BCNF:** **Satisfied.** All left-hand determinants are superkeys.
- **Conclusion:** `TRAIN_SCHEDULE` is in **BCNF**.

---

### 2.6 Relation: `SEAT` (Critical Architectural Trade-off)
- **Attribute Set:** $\{\text{seat\_id}, \text{train\_id}, \text{coach\_number}, \text{seat\_number}, \text{coach\_class}, \text{berth\_type}\}$
- **Candidate Keys:** 
  - $CK_1 = \{\text{seat\_id}\}$
  - $CK_2 = \{\text{train\_id}, \text{coach\_number}, \text{seat\_number}\}$
- **Prime Attributes:** $\{\text{seat\_id}, \text{train\_id}, \text{coach\_number}, \text{seat\_number}\}$
- **Non-Prime Attributes:** $\{\text{coach\_class}, \text{berth\_type}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{seat\_id}\} \longrightarrow \{\text{train\_id}, \text{coach\_number}, \text{seat\_number}, \text{coach\_class}, \text{berth\_type}\}$
2. $FD_2: \{\text{train\_id}, \text{coach\_number}, \text{seat\_number}\} \longrightarrow \{\text{seat\_id}, \text{coach\_class}, \text{berth\_type}\}$
3. $FD_3: \{\text{coach\_number}\} \longrightarrow \{\text{coach\_class}\}$ *(or strictly, within a train: $\{\text{train\_id}, \text{coach\_number}\} \longrightarrow \{\text{coach\_class}\}$)*

#### In-Depth Normal Form Evaluation & BCNF Violation:
- **1NF:** Satisfied. Atomic attributes throughout.
- **2NF:** In 2NF if evaluating $CK_1 = \{\text{seat\_id}\}$ (single-attribute PK). If considering $CK_2$, $FD_3$ demonstrates that non-prime attribute `coach_class` is functionally determined by a proper subset of $CK_2$, namely $\{\text{train\_id}, \text{coach\_number}\}$.
- **3NF:** In traditional 3NF formulation with surrogate key $\text{seat\_id}$ as primary key, `coach_class` is transitively dependent through `coach_number`.
- **BCNF:** **VIOLATED.**
  - Consider the dependency:
    $$\{\text{train\_id}, \text{coach\_number}\} \longrightarrow \{\text{coach\_class}\}$$
  - The determinant $\{\text{train\_id}, \text{coach\_number}\}$ is **NOT a superkey** of `SEAT` (because it cannot identify individual `seat_number` or `berth_type`).
  - Therefore, `SEAT` is **NOT in BCNF**. It resides strictly in **3NF / 2NF**.

#### The Accepted Engineering Trade-Off:
To resolve this violation and achieve pure BCNF, `SEAT` would need to be decomposed into two distinct relations:
$$\textbf{COACH}\left(\underline{\text{train\_id}, \text{coach\_number}}, \text{coach\_class}\right)$$
$$\textbf{SEAT}\left(\underline{\text{seat\_id}}, \text{train\_id}, \text{coach\_number}, \text{seat\_number}, \text{berth\_type}\right)$$

> [!IMPORTANT]
> **DOCUMENTED 8-TABLE ACADEMIC TRADE-OFF**  
> Decomposing `SEAT` into `COACH` and `SEAT` would expand the database to **9 tables**. The project course guidelines for **BCSE302L** mandate an **exact 8-table relational architecture**. 
> 
> Collapsing `coach_class` directly into `SEAT` is an **explicit, documented engineering compromise**. It minimizes multi-table join depth during high-throughput seat inventory inquiries and satisfies the course scope, while accepting the minor transitive dependency redundancy.

- **Conclusion:** `SEAT` is in **3NF** (accepted trade-off due to 8-table constraint).

---

### 2.7 Relation: `RESERVATION`
- **Attribute Set:** $\{\text{reservation\_id}, \text{pnr}, \text{passenger\_id}, \text{schedule\_id}, \text{seat\_id}, \text{source\_station\_id}, \text{destination\_station\_id}, \text{booking\_timestamp}, \text{booking\_status}, \text{fare\_amount}\}$
- **Candidate Keys:** 
  - $CK_1 = \{\text{reservation\_id}\}$
  - $CK_2 = \{\text{pnr}\}$
- **Prime Attributes:** $\{\text{reservation\_id}, \text{pnr}\}$
- **Non-Prime Attributes:** $\{\text{passenger\_id}, \text{schedule\_id}, \text{seat\_id}, \text{source\_station\_id}, \text{destination\_station\_id}, \text{booking\_timestamp}, \text{booking\_status}, \text{fare\_amount}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{reservation\_id}\} \longrightarrow \{\text{pnr}, \text{passenger\_id}, \text{schedule\_id}, \text{seat\_id}, \text{source\_station\_id}, \text{destination\_station\_id}, \text{booking\_timestamp}, \text{booking\_status}, \text{fare\_amount}\}$
2. $FD_2: \{\text{pnr}\} \longrightarrow \{\text{reservation\_id}, \text{passenger\_id}, \text{schedule\_id}, \text{seat\_id}, \text{source\_station\_id}, \text{destination\_station\_id}, \text{booking\_timestamp}, \text{booking\_status}, \text{fare\_amount}\}$

#### Normal Form Evaluation:
- **1NF:** Satisfied. Atomic fields.
- **2NF:** Satisfied. Both candidate keys are single-attribute; no partial dependencies.
- **3NF:** Satisfied. Determinants are superkeys.
- **BCNF:** **Satisfied.** Every non-trivial determinant is a superkey.
- **Conclusion:** `RESERVATION` is in **BCNF**.

---

### 2.8 Relation: `PAYMENT`
- **Attribute Set:** $\{\text{payment\_id}, \text{reservation\_id}, \text{amount}, \text{payment\_method}, \text{payment\_status}, \text{transaction\_reference}, \text{payment\_timestamp}\}$
- **Candidate Keys:** 
  - $CK_1 = \{\text{payment\_id}\}$
  - $CK_2 = \{\text{transaction\_reference}\}$
- **Prime Attributes:** $\{\text{payment\_id}, \text{transaction\_reference}\}$
- **Non-Prime Attributes:** $\{\text{reservation\_id}, \text{amount}, \text{payment\_method}, \text{payment\_status}, \text{payment\_timestamp}\}$

#### Functional Dependencies:
1. $FD_1: \{\text{payment\_id}\} \longrightarrow \{\text{reservation\_id}, \text{amount}, \text{payment\_method}, \text{payment\_status}, \text{transaction\_reference}, \text{payment\_timestamp}\}$
2. $FD_2: \{\text{transaction\_reference}\} \longrightarrow \{\text{payment\_id}, \text{reservation\_id}, \text{amount}, \text{payment\_method}, \text{payment\_status}, \text{payment\_timestamp}\}$

#### Normal Form Evaluation:
- **1NF:** Satisfied. Atomic scalar values.
- **2NF:** Satisfied. Single-attribute candidate keys.
- **3NF:** Satisfied. Determinants are superkeys.
- **BCNF:** **Satisfied.** All determinants are valid superkeys.
- **Conclusion:** `PAYMENT` is in **BCNF**.

---

## 3. Summary of Normal Forms Across the Schema

| Table Name | Evaluated Normal Form | Determinant is Superkey? | Normalization Assessment |
| :--- | :---: | :---: | :--- |
| **`PASSENGER`** | **BCNF** | Yes | Fully normalized; zero redundancy. |
| **`STATION`** | **BCNF** | Yes | Fully normalized; zero redundancy. |
| **`TRAIN`** | **BCNF** | Yes | Fully normalized; zero redundancy. |
| **`TRAIN_STOP`** | **BCNF** | Yes | Compound route table normalized to BCNF. |
| **`TRAIN_SCHEDULE`** | **BCNF** | Yes | Temporal run table normalized to BCNF. |
| **`SEAT`** | **3NF** | **No** ($\{\text{coach\_number}\} \rightarrow \text{class}$) | **Accepted engineering trade-off** to preserve 8-table scope. |
| **`RESERVATION`** | **BCNF** | Yes | Fully normalized booking core. |
| **`PAYMENT`** | **BCNF** | Yes | Fully normalized financial ledger. |
