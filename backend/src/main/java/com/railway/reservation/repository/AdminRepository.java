package com.railway.reservation.repository;

import com.railway.reservation.dto.QueryResultResponse;
import com.railway.reservation.exception.DatabaseOperationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * JDBC Repository for Admin Lab operations and predefined academic queries (Q01 - Q15).
 * Enables the Database Operations Lab to execute queries, inspect schemas, and measure execution performance.
 */
@Repository
public class AdminRepository {

    private static final Logger log = LoggerFactory.getLogger(AdminRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    private final Map<String, String> queryRegistry = new LinkedHashMap<>();
    private final Map<String, String> descriptionRegistry = new LinkedHashMap<>();

    public AdminRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
        initQueries();
    }

    private void initQueries() {
        queryRegistry.put("Q01", """
            SELECT t.TRAIN_NUMBER, t.TRAIN_NAME, s1.STATION_NAME AS SOURCE, s2.STATION_NAME AS DESTINATION,
                   stop1.DEPARTURE_TIME, stop2.ARRIVAL_TIME
            FROM TRAIN t
            JOIN TRAIN_STOP stop1 ON t.TRAIN_ID = stop1.TRAIN_ID
            JOIN STATION s1 ON stop1.STATION_ID = s1.STATION_ID
            JOIN TRAIN_STOP stop2 ON t.TRAIN_ID = stop2.TRAIN_ID
            JOIN STATION s2 ON stop2.STATION_ID = s2.STATION_ID
            WHERE stop1.STOP_SEQUENCE < stop2.STOP_SEQUENCE
            ORDER BY t.TRAIN_NUMBER
            """);
        descriptionRegistry.put("Q01", "Direct and intermediate route connections between stations");

        queryRegistry.put("Q02", """
            SELECT s.STATION_CODE, s.STATION_NAME, s.CITY, COUNT(ts.TRAIN_ID) AS TRAINS_SERVICED
            FROM STATION s
            LEFT JOIN TRAIN_STOP ts ON s.STATION_ID = ts.STATION_ID
            GROUP BY s.STATION_CODE, s.STATION_NAME, s.CITY
            ORDER BY TRAINS_SERVICED DESC
            """);
        descriptionRegistry.put("Q02", "Station throughput: Count of trains servicing each station");

        queryRegistry.put("Q03", """
            SELECT TRUNC(BOOKING_TIMESTAMP) AS BOOKING_DATE, COUNT(RESERVATION_ID) AS DAILY_BOOKINGS,
                   NVL(SUM(FARE_AMOUNT), 0) AS DAILY_REVENUE
            FROM RESERVATION
            GROUP BY TRUNC(BOOKING_TIMESTAMP)
            ORDER BY BOOKING_DATE DESC
            """);
        descriptionRegistry.put("Q03", "Daily booking volumes and revenue collection");

        queryRegistry.put("Q04", """
            SELECT COACH_CLASS, COUNT(*) AS TOTAL_SEATS
            FROM SEAT
            GROUP BY COACH_CLASS
            ORDER BY TOTAL_SEATS DESC
            """);
        descriptionRegistry.put("Q04", "Total seat inventory distribution by coach class");

        queryRegistry.put("Q05", """
            SELECT r.PNR, p.FULL_NAME, t.TRAIN_NUMBER, t.TRAIN_NAME, r.BOOKING_STATUS, r.FARE_AMOUNT
            FROM RESERVATION r
            JOIN PASSENGER p ON r.PASSENGER_ID = p.PASSENGER_ID
            JOIN TRAIN_SCHEDULE sch ON r.SCHEDULE_ID = sch.SCHEDULE_ID
            JOIN TRAIN t ON sch.TRAIN_ID = t.TRAIN_ID
            ORDER BY r.BOOKING_TIMESTAMP DESC
            """);
        descriptionRegistry.put("Q05", "Recent reservations joined with passenger and train details");

        queryRegistry.put("Q06", """
            SELECT sch.SCHEDULE_ID, t.TRAIN_NUMBER, t.TRAIN_NAME, sch.JOURNEY_DATE, sch.SCHEDULE_STATUS
            FROM TRAIN_SCHEDULE sch
            JOIN TRAIN t ON sch.TRAIN_ID = t.TRAIN_ID
            WHERE sch.JOURNEY_DATE >= TRUNC(SYSDATE)
            ORDER BY sch.JOURNEY_DATE ASC
            """);
        descriptionRegistry.put("Q06", "Upcoming active train schedules");

        queryRegistry.put("Q07", """
            SELECT r.PNR, p.FULL_NAME, p.PHONE, r.BOOKING_TIMESTAMP, r.FARE_AMOUNT
            FROM RESERVATION r
            JOIN PASSENGER p ON r.PASSENGER_ID = p.PASSENGER_ID
            WHERE r.BOOKING_STATUS = 'PENDING'
            ORDER BY r.BOOKING_TIMESTAMP ASC
            """);
        descriptionRegistry.put("Q07", "Pending reservations pending payment clearance");

        queryRegistry.put("Q08", """
            SELECT t.TRAIN_NUMBER, t.TRAIN_NAME, s.COACH_CLASS,
                   COUNT(s.SEAT_ID) AS TOTAL_SEATS,
                   COUNT(r.RESERVATION_ID) AS BOOKED_SEATS,
                   ROUND(COUNT(r.RESERVATION_ID) * 100.0 / NULLIF(COUNT(s.SEAT_ID), 0), 2) AS OCCUPANCY_PCT
            FROM TRAIN t
            JOIN SEAT s ON t.TRAIN_ID = s.TRAIN_ID
            LEFT JOIN TRAIN_SCHEDULE sch ON t.TRAIN_ID = sch.TRAIN_ID
            LEFT JOIN RESERVATION r ON sch.SCHEDULE_ID = r.SCHEDULE_ID AND s.SEAT_ID = r.SEAT_ID AND r.BOOKING_STATUS = 'CONFIRMED'
            GROUP BY t.TRAIN_NUMBER, t.TRAIN_NAME, s.COACH_CLASS
            ORDER BY t.TRAIN_NUMBER, s.COACH_CLASS
            """);
        descriptionRegistry.put("Q08", "Coach occupancy percentage analysis per train");

        queryRegistry.put("Q09", """
            SELECT t.TRAIN_NUMBER, t.TRAIN_NAME,
                   COUNT(DISTINCT r.RESERVATION_ID) AS BOOKINGS_COUNT,
                   NVL(SUM(CASE WHEN p.PAYMENT_STATUS = 'SUCCESS' THEN p.AMOUNT ELSE 0 END), 0) AS GROSS_REVENUE,
                   NVL(SUM(CASE WHEN p.PAYMENT_STATUS = 'REFUNDED' THEN p.AMOUNT ELSE 0 END), 0) AS REFUNDS
            FROM TRAIN t
            LEFT JOIN TRAIN_SCHEDULE sch ON t.TRAIN_ID = sch.TRAIN_ID
            LEFT JOIN RESERVATION r ON sch.SCHEDULE_ID = r.SCHEDULE_ID
            LEFT JOIN PAYMENT p ON r.RESERVATION_ID = p.RESERVATION_ID
            GROUP BY t.TRAIN_NUMBER, t.TRAIN_NAME
            ORDER BY GROSS_REVENUE DESC
            """);
        descriptionRegistry.put("Q09", "Financial performance and revenue breakdown by train");

        queryRegistry.put("Q10", """
            SELECT s1.STATION_CODE AS ORIGIN, s2.STATION_CODE AS DESTINATION,
                   COUNT(r.RESERVATION_ID) AS PASSENGERS, NVL(SUM(r.FARE_AMOUNT), 0) AS REVENUE
            FROM RESERVATION r
            JOIN STATION s1 ON r.SOURCE_STATION_ID = s1.STATION_ID
            JOIN STATION s2 ON r.DESTINATION_STATION_ID = s2.STATION_ID
            WHERE r.BOOKING_STATUS = 'CONFIRMED'
            GROUP BY s1.STATION_CODE, s2.STATION_CODE
            ORDER BY PASSENGERS DESC
            """);
        descriptionRegistry.put("Q10", "Most popular passenger travel routes");

        queryRegistry.put("Q11", """
            SELECT PAYMENT_METHOD, COUNT(*) AS TRANSACTIONS_COUNT,
                   NVL(SUM(AMOUNT), 0) AS TOTAL_AMOUNT
            FROM PAYMENT
            WHERE PAYMENT_STATUS = 'SUCCESS'
            GROUP BY PAYMENT_METHOD
            ORDER BY TOTAL_AMOUNT DESC
            """);
        descriptionRegistry.put("Q11", "Payment method distribution and breakdown");

        queryRegistry.put("Q12", """
            SELECT BERTH_TYPE, COUNT(*) AS TOTAL_BERTHS
            FROM SEAT
            GROUP BY BERTH_TYPE
            ORDER BY TOTAL_BERTHS DESC
            """);
        descriptionRegistry.put("Q12", "Berth type inventory distribution");

        queryRegistry.put("Q13", """
            SELECT SCHEDULE_STATUS, COUNT(*) AS SCHEDULE_COUNT
            FROM TRAIN_SCHEDULE
            GROUP BY SCHEDULE_STATUS
            """);
        descriptionRegistry.put("Q13", "Schedule operational status distribution");

        queryRegistry.put("Q14", """
            SELECT TO_CHAR(BOOKING_TIMESTAMP, 'YYYY-MM') AS MONTH, COUNT(*) AS BOOKINGS,
                   NVL(SUM(FARE_AMOUNT), 0) AS REVENUE
            FROM RESERVATION
            GROUP BY TO_CHAR(BOOKING_TIMESTAMP, 'YYYY-MM')
            ORDER BY MONTH DESC
            """);
        descriptionRegistry.put("Q14", "Monthly booking trends and revenue");

        queryRegistry.put("Q15", """
            SELECT p.PASSENGER_ID, p.FULL_NAME, p.PHONE, COUNT(r.RESERVATION_ID) AS TRIPS,
                   NVL(SUM(r.FARE_AMOUNT), 0) AS SPEND
            FROM PASSENGER p
            JOIN RESERVATION r ON p.PASSENGER_ID = r.PASSENGER_ID
            WHERE r.BOOKING_STATUS = 'CONFIRMED'
            GROUP BY p.PASSENGER_ID, p.FULL_NAME, p.PHONE
            ORDER BY SPEND DESC
            """);
        descriptionRegistry.put("Q15", "Top frequent travelers and high-value passengers");
    }

    public Map<String, String> getAvailableQueries() {
        return new LinkedHashMap<>(descriptionRegistry);
    }

    /**
     * Executes a designated query by ID and packages the result dynamically with column metadata and row maps.
     */
    public QueryResultResponse executeQuery(String queryId) {
        String normalizedId = queryId.toUpperCase().trim();
        String sql = queryRegistry.get(normalizedId);

        if (sql == null) {
            throw new IllegalArgumentException("Unknown query ID: " + queryId + ". Available IDs: " + queryRegistry.keySet());
        }

        String description = descriptionRegistry.getOrDefault(normalizedId, "Database Lab Query " + normalizedId);

        long startTime = System.currentTimeMillis();
        List<String> columnNames = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();

            for (int i = 1; i <= columnCount; i++) {
                columnNames.add(metaData.getColumnLabel(i));
            }

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    row.put(metaData.getColumnLabel(i), rs.getObject(i));
                }
                rows.add(row);
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("Executed Lab Query {} in {} ms, returned {} rows", normalizedId, duration, rows.size());

            return QueryResultResponse.builder()
                    .queryId(normalizedId)
                    .description(description)
                    .executionTimeMs(duration)
                    .columns(columnNames)
                    .rows(rows)
                    .build();

        } catch (SQLException e) {
            log.error("Failed to execute lab query {}: {}", normalizedId, e.getMessage(), e);
            throw new DatabaseOperationException("Query execution failed: " + e.getMessage(), e.getErrorCode(), e);
        }
    }
}
