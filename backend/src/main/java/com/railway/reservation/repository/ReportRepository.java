package com.railway.reservation.repository;

import com.railway.reservation.dto.DashboardResponse;
import com.railway.reservation.dto.MonthlyBookingReport;
import com.railway.reservation.dto.OccupancyReport;
import com.railway.reservation.dto.PopularRouteReport;
import com.railway.reservation.dto.RevenueReport;
import com.railway.reservation.exception.DatabaseOperationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

/**
 * JDBC Repository for Analytics, Reporting, and Stored Procedures/Functions:
 * - Query Q08: Coach Occupancy Analysis
 * - Query Q09: Financial Revenue Summary per Train
 * - Query Q10: Top Popular Travel Routes
 * - Query Q14: Monthly Booking Trends
 * - Function F_AVAILABLE_SEAT_COUNT via CallableStatement
 * - Procedure P_EXPIRE_STALE_RESERVATIONS via CallableStatement
 */
@Repository
public class ReportRepository {

    private static final Logger log = LoggerFactory.getLogger(ReportRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public ReportRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Aggregates key system metrics for the administrative dashboard.
     */
    public DashboardResponse getDashboardStats() {
        Long totalPassengers = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM PASSENGER", Long.class);
        Long totalTrains = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM TRAIN", Long.class);
        Long totalStations = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM STATION", Long.class);
        Long totalReservations = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM RESERVATION", Long.class);
        Long confirmedCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM RESERVATION WHERE UPPER(BOOKING_STATUS) = 'CONFIRMED'", Long.class);
        Long pendingCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM RESERVATION WHERE UPPER(BOOKING_STATUS) = 'PENDING'", Long.class);
        Long cancelledCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM RESERVATION WHERE UPPER(BOOKING_STATUS) = 'CANCELLED'", Long.class);
        BigDecimal totalRevenue = jdbcTemplate.queryForObject("SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENT WHERE PAYMENT_STATUS = 'SUCCESS'", BigDecimal.class);
        BigDecimal totalRefunds = jdbcTemplate.queryForObject("SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENT WHERE PAYMENT_STATUS = 'REFUNDED'", BigDecimal.class);

        return DashboardResponse.builder()
                .totalPassengers(totalPassengers != null ? totalPassengers : 0L)
                .totalTrains(totalTrains != null ? totalTrains : 0L)
                .totalStations(totalStations != null ? totalStations : 0L)
                .totalReservations(totalReservations != null ? totalReservations : 0L)
                .confirmedCount(confirmedCount != null ? confirmedCount : 0L)
                .pendingCount(pendingCount != null ? pendingCount : 0L)
                .cancelledCount(cancelledCount != null ? cancelledCount : 0L)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalRefunds(totalRefunds != null ? totalRefunds : BigDecimal.ZERO)
                .build();
    }

    /**
     * Query Q09: Financial Revenue Summary per Train.
     */
    public List<RevenueReport> getRevenueReport() {
        String sql = """
            SELECT
                t.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                COUNT(DISTINCT r.RESERVATION_ID) AS TOTAL_BOOKINGS,
                NVL(SUM(CASE WHEN p.PAYMENT_STATUS = 'SUCCESS' THEN p.AMOUNT ELSE 0 END), 0) AS GROSS_REVENUE,
                NVL(SUM(CASE WHEN p.PAYMENT_STATUS = 'REFUNDED' THEN p.AMOUNT ELSE 0 END), 0) AS TOTAL_REFUNDS,
                NVL(SUM(CASE WHEN p.PAYMENT_STATUS = 'SUCCESS' THEN p.AMOUNT
                             WHEN p.PAYMENT_STATUS = 'REFUNDED' THEN -p.AMOUNT ELSE 0 END), 0) AS NET_REVENUE
            FROM TRAIN t
            LEFT JOIN TRAIN_SCHEDULE ts ON t.TRAIN_ID = ts.TRAIN_ID
            LEFT JOIN RESERVATION r ON ts.SCHEDULE_ID = r.SCHEDULE_ID
            LEFT JOIN PAYMENT p ON r.RESERVATION_ID = p.RESERVATION_ID
            GROUP BY t.TRAIN_ID, t.TRAIN_NUMBER, t.TRAIN_NAME
            ORDER BY NET_REVENUE DESC, t.TRAIN_NUMBER ASC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> RevenueReport.builder()
                .trainId(rs.getLong("TRAIN_ID"))
                .trainNumber(rs.getString("TRAIN_NUMBER"))
                .trainName(rs.getString("TRAIN_NAME"))
                .totalBookings(rs.getLong("TOTAL_BOOKINGS"))
                .grossRevenue(rs.getBigDecimal("GROSS_REVENUE"))
                .totalRefunds(rs.getBigDecimal("TOTAL_REFUNDS"))
                .netRevenue(rs.getBigDecimal("NET_REVENUE"))
                .build());
    }

    /**
     * Query Q08: Coach Occupancy Analysis across train schedules.
     */
    public List<OccupancyReport> getOccupancyReport() {
        String sql = """
            SELECT
                t.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                ts.JOURNEY_DATE,
                s.COACH_CLASS,
                COUNT(s.SEAT_ID) AS TOTAL_SEATS,
                COUNT(r.RESERVATION_ID) AS BOOKED_SEATS,
                COUNT(s.SEAT_ID) - COUNT(r.RESERVATION_ID) AS AVAILABLE_SEATS,
                ROUND(COUNT(r.RESERVATION_ID) * 100.0 / NULLIF(COUNT(s.SEAT_ID), 0), 2) AS OCCUPANCY_PERCENTAGE
            FROM TRAIN_SCHEDULE ts
            JOIN TRAIN t ON ts.TRAIN_ID = t.TRAIN_ID
            JOIN SEAT s ON t.TRAIN_ID = s.TRAIN_ID
            LEFT JOIN RESERVATION r ON ts.SCHEDULE_ID = r.SCHEDULE_ID
                                   AND s.SEAT_ID = r.SEAT_ID
                                   AND r.BOOKING_STATUS = 'CONFIRMED'
            GROUP BY t.TRAIN_ID, t.TRAIN_NUMBER, t.TRAIN_NAME, ts.JOURNEY_DATE, s.COACH_CLASS
            ORDER BY ts.JOURNEY_DATE DESC, t.TRAIN_NUMBER ASC, s.COACH_CLASS ASC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> OccupancyReport.builder()
                .trainId(rs.getLong("TRAIN_ID"))
                .trainNumber(rs.getString("TRAIN_NUMBER"))
                .trainName(rs.getString("TRAIN_NAME"))
                .journeyDate(rs.getDate("JOURNEY_DATE").toLocalDate())
                .coachClass(rs.getString("COACH_CLASS"))
                .totalSeats(rs.getInt("TOTAL_SEATS"))
                .bookedSeats(rs.getInt("BOOKED_SEATS"))
                .availableSeats(rs.getInt("AVAILABLE_SEATS"))
                .occupancyPercentage(rs.getDouble("OCCUPANCY_PERCENTAGE"))
                .build());
    }

    /**
     * Query Q14: Monthly Booking Trends and Aggregate Stats.
     */
    public List<MonthlyBookingReport> getMonthlyBookings() {
        String sql = """
            SELECT
                TO_CHAR(r.BOOKING_TIMESTAMP, 'YYYY-MM') AS BOOKING_MONTH,
                EXTRACT(YEAR FROM r.BOOKING_TIMESTAMP) AS BOOKING_YEAR,
                COUNT(r.RESERVATION_ID) AS TOTAL_BOOKINGS,
                COUNT(CASE WHEN r.BOOKING_STATUS = 'CONFIRMED' THEN 1 END) AS CONFIRMED_BOOKINGS,
                COUNT(CASE WHEN r.BOOKING_STATUS = 'CANCELLED' THEN 1 END) AS CANCELLED_BOOKINGS,
                NVL(SUM(CASE WHEN r.BOOKING_STATUS = 'CONFIRMED' THEN r.FARE_AMOUNT ELSE 0 END), 0) AS TOTAL_REVENUE
            FROM RESERVATION r
            GROUP BY TO_CHAR(r.BOOKING_TIMESTAMP, 'YYYY-MM'), EXTRACT(YEAR FROM r.BOOKING_TIMESTAMP)
            ORDER BY BOOKING_MONTH DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> MonthlyBookingReport.builder()
                .bookingMonth(rs.getString("BOOKING_MONTH"))
                .year(rs.getInt("BOOKING_YEAR"))
                .totalBookings(rs.getLong("TOTAL_BOOKINGS"))
                .confirmedBookings(rs.getLong("CONFIRMED_BOOKINGS"))
                .cancelledBookings(rs.getLong("CANCELLED_BOOKINGS"))
                .totalRevenue(rs.getBigDecimal("TOTAL_REVENUE"))
                .build());
    }

    /**
     * Query Q10: Top Popular Travel Routes.
     */
    public List<PopularRouteReport> getPopularRoutes() {
        String sql = """
            SELECT
                src.STATION_ID AS SRC_ID,
                src.STATION_CODE AS SRC_CODE,
                src.STATION_NAME AS SRC_NAME,
                dst.STATION_ID AS DST_ID,
                dst.STATION_CODE AS DST_CODE,
                dst.STATION_NAME AS DST_NAME,
                COUNT(DISTINCT r.SCHEDULE_ID) AS TOTAL_TRIPS,
                COUNT(r.RESERVATION_ID) AS TOTAL_PASSENGERS,
                NVL(SUM(r.FARE_AMOUNT), 0) AS TOTAL_REVENUE
            FROM RESERVATION r
            JOIN STATION src ON r.SOURCE_STATION_ID = src.STATION_ID
            JOIN STATION dst ON r.DESTINATION_STATION_ID = dst.STATION_ID
            WHERE r.BOOKING_STATUS = 'CONFIRMED'
            GROUP BY src.STATION_ID, src.STATION_CODE, src.STATION_NAME, dst.STATION_ID, dst.STATION_CODE, dst.STATION_NAME
            ORDER BY TOTAL_PASSENGERS DESC, TOTAL_REVENUE DESC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> PopularRouteReport.builder()
                .sourceStationId(rs.getLong("SRC_ID"))
                .sourceStationCode(rs.getString("SRC_CODE"))
                .sourceStationName(rs.getString("SRC_NAME"))
                .destinationStationId(rs.getLong("DST_ID"))
                .destinationStationCode(rs.getString("DST_CODE"))
                .destinationStationName(rs.getString("DST_NAME"))
                .totalTrips(rs.getLong("TOTAL_TRIPS"))
                .totalPassengers(rs.getLong("TOTAL_PASSENGERS"))
                .totalRevenue(rs.getBigDecimal("TOTAL_REVENUE"))
                .build());
    }

    /**
     * Invokes PL/SQL Function F_AVAILABLE_SEAT_COUNT directly via CallableStatement.
     */
    public int getAvailableSeatCount(Long scheduleId, String coachClass) {
        String sql = "{ ? = CALL F_AVAILABLE_SEAT_COUNT(?, ?) }";
        log.info("Calling PL/SQL function F_AVAILABLE_SEAT_COUNT for scheduleId={}, coachClass={}", scheduleId, coachClass);

        try (Connection conn = dataSource.getConnection();
             CallableStatement cs = conn.prepareCall(sql)) {

            // Register return value
            cs.registerOutParameter(1, Types.INTEGER);

            // Set arguments
            cs.setLong(2, scheduleId);
            cs.setString(3, coachClass);

            cs.execute();
            return cs.getInt(1);
        } catch (SQLException e) {
            log.error("Failed to execute function F_AVAILABLE_SEAT_COUNT: {}", e.getMessage(), e);
            throw new DatabaseOperationException(e.getMessage(), e.getErrorCode(), e);
        }
    }

    /**
     * Invokes PL/SQL Stored Procedure P_EXPIRE_STALE_RESERVATIONS via CallableStatement.
     */
    public int expirePendingReservations(int maxAgeMinutes) {
        String sql = "{ CALL P_EXPIRE_STALE_RESERVATIONS(?, ?) }";
        log.info("Calling stored procedure P_EXPIRE_STALE_RESERVATIONS with maxAgeMinutes={}", maxAgeMinutes);

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            try (CallableStatement cs = conn.prepareCall(sql)) {
                cs.setInt(1, maxAgeMinutes);
                cs.registerOutParameter(2, Types.INTEGER); // p_expired_count

                cs.execute();

                int expiredCount = cs.getInt(2);
                conn.commit();
                log.info("P_EXPIRE_STALE_RESERVATIONS successfully expired {} stale reservations", expiredCount);
                return expiredCount;

            } catch (SQLException e) {
                log.error("Error in P_EXPIRE_STALE_RESERVATIONS. Rolling back: {}", e.getMessage(), e);
                conn.rollback();
                throw new DatabaseOperationException(e.getMessage(), e.getErrorCode(), e);
            }
        } catch (SQLException e) {
            log.error("Connection or transaction error during expirePendingReservations: {}", e.getMessage(), e);
            throw new DatabaseOperationException("Connection error during reservation expiry: " + e.getMessage(), e.getErrorCode(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    log.warn("Failed to reset autoCommit: {}", e.getMessage());
                }
            }
        }
    }
}
