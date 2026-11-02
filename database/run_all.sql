-- ============================================================================
-- PURPOSE: Master execution script running all 15 database components in
--          strict sequential order.
-- ============================================================================

SET ECHO OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 200;
SET PAGESIZE 100;

PROMPT ============================================================================
PROMPT STARTING RAILWAY RESERVATION SYSTEM SCHEMA DEPLOYMENT & TEST SUITE
PROMPT ============================================================================

PROMPT [1/15] Running 01_reset_schema.sql...
@@01_reset_schema.sql;

PROMPT [2/15] Running 02_create_tables.sql...
@@02_create_tables.sql;

PROMPT [3/15] Running 03_create_sequences.sql...
@@03_create_sequences.sql;

PROMPT [4/15] Running 04_create_indexes.sql...
@@04_create_indexes.sql;

PROMPT [5/15] Running 05_create_functions.sql...
@@05_create_functions.sql;

PROMPT [6/15] Running 06_create_procedures.sql...
@@06_create_procedures.sql;

PROMPT [7/15] Running 07_create_triggers.sql...
@@07_create_triggers.sql;

PROMPT [8/15] Running 08_create_views.sql...
@@08_create_views.sql;

PROMPT [9/15] Running 09_insert_seed_data.sql...
@@09_insert_seed_data.sql;

PROMPT [10/15] Running 10_sql_queries.sql...
@@10_sql_queries.sql;

PROMPT [11/15] Running 11_transaction_demos.sql...
@@11_transaction_demos.sql;

PROMPT [12/15] Running 12_acid_tests.sql...
@@12_acid_tests.sql;

PROMPT [13/15] Running 13_concurrency_tests.sql...
@@13_concurrency_tests.sql;

PROMPT [14/15] Running 14_constraint_tests.sql...
@@14_constraint_tests.sql;

PROMPT [15/15] Running 15_data_validation.sql...
@@15_data_validation.sql;

PROMPT ============================================================================
PROMPT COMPLETE DEPLOYMENT & VALIDATION FINISHED SUCCESSFULLY!
PROMPT ============================================================================
