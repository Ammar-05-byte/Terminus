package com.railway.reservation.repository;

import com.railway.reservation.dto.SeatAvailabilityResponse;
import com.railway.reservation.model.Seat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Repository for SEAT table operations and seat inventory queries.
 */
@Repository
public class SeatRepository {

    private static final Logger log = LoggerFactory.getLogger(SeatRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public SeatRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Seat> seatRowMapper = (rs, rowNum) -> Seat.builder()
            .seatId(rs.getLong("SEAT_ID"))
            .trainId(rs.getLong("TRAIN_ID"))
            .coachNumber(rs.getString("COACH_NUMBER"))
            .seatNumber(rs.getInt("SEAT_NUMBER"))
            .coachClass(rs.getString("COACH_CLASS"))
            .berthType(rs.getString("BERTH_TYPE"))
            .build();

    public List<Seat> findAll() {
        String sql = "SELECT SEAT_ID, TRAIN_ID, COACH_NUMBER, SEAT_NUMBER, COACH_CLASS, BERTH_TYPE " +
                     "FROM SEAT ORDER BY TRAIN_ID ASC, COACH_NUMBER ASC, SEAT_NUMBER ASC";
        return jdbcTemplate.query(sql, seatRowMapper);
    }

    public Optional<Seat> findById(Long id) {
        String sql = "SELECT SEAT_ID, TRAIN_ID, COACH_NUMBER, SEAT_NUMBER, COACH_CLASS, BERTH_TYPE " +
                     "FROM SEAT WHERE SEAT_ID = ?";
        List<Seat> results = jdbcTemplate.query(sql, seatRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<Seat> findByTrain(Long trainId) {
        String sql = "SELECT SEAT_ID, TRAIN_ID, COACH_NUMBER, SEAT_NUMBER, COACH_CLASS, BERTH_TYPE " +
                     "FROM SEAT WHERE TRAIN_ID = ? ORDER BY COACH_NUMBER ASC, SEAT_NUMBER ASC";
        return jdbcTemplate.query(sql, seatRowMapper, trainId);
    }

    /**
     * Finds seats that are unreserved for a specific train schedule and optional coach class.
     */
    public List<Seat> findAvailableSeats(Long scheduleId, String coachClass) {
        String sql;
        if (coachClass != null && !coachClass.trim().isEmpty()) {
            sql = """
                SELECT st.SEAT_ID, st.TRAIN_ID, st.COACH_NUMBER, st.SEAT_NUMBER, st.COACH_CLASS, st.BERTH_TYPE
                FROM SEAT st
                JOIN TRAIN_SCHEDULE sch ON sch.TRAIN_ID = st.TRAIN_ID
                WHERE sch.SCHEDULE_ID = ?
                  AND UPPER(st.COACH_CLASS) = UPPER(?)
                  AND st.SEAT_ID NOT IN (
                      SELECT r.SEAT_ID
                      FROM RESERVATION r
                      WHERE r.SCHEDULE_ID = sch.SCHEDULE_ID
                        AND r.BOOKING_STATUS IN ('CONFIRMED', 'PENDING')
                  )
                ORDER BY st.COACH_NUMBER ASC, st.SEAT_NUMBER ASC
                """;
            return jdbcTemplate.query(sql, seatRowMapper, scheduleId, coachClass.trim());
        } else {
            sql = """
                SELECT st.SEAT_ID, st.TRAIN_ID, st.COACH_NUMBER, st.SEAT_NUMBER, st.COACH_CLASS, st.BERTH_TYPE
                FROM SEAT st
                JOIN TRAIN_SCHEDULE sch ON sch.TRAIN_ID = st.TRAIN_ID
                WHERE sch.SCHEDULE_ID = ?
                  AND st.SEAT_ID NOT IN (
                      SELECT r.SEAT_ID
                      FROM RESERVATION r
                      WHERE r.SCHEDULE_ID = sch.SCHEDULE_ID
                        AND r.BOOKING_STATUS IN ('CONFIRMED', 'PENDING')
                  )
                ORDER BY st.COACH_NUMBER ASC, st.SEAT_NUMBER ASC
                """;
            return jdbcTemplate.query(sql, seatRowMapper, scheduleId);
        }
    }

    /**
     * Returns full seat layout for a schedule, each tagged with real-time availability.
     */
    public List<SeatAvailabilityResponse> findByScheduleWithAvailability(Long scheduleId) {
        String sql = """
            SELECT
                st.SEAT_ID,
                st.COACH_NUMBER,
                st.SEAT_NUMBER,
                st.COACH_CLASS,
                st.BERTH_TYPE,
                CASE WHEN res.RESERVATION_ID IS NULL THEN 1 ELSE 0 END AS IS_AVAILABLE
            FROM SEAT st
            JOIN TRAIN_SCHEDULE sch ON sch.TRAIN_ID = st.TRAIN_ID
            LEFT JOIN RESERVATION res ON res.SEAT_ID = st.SEAT_ID
                                     AND res.SCHEDULE_ID = sch.SCHEDULE_ID
                                     AND res.BOOKING_STATUS IN ('CONFIRMED', 'PENDING')
            WHERE sch.SCHEDULE_ID = ?
            ORDER BY st.COACH_NUMBER ASC, st.SEAT_NUMBER ASC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> SeatAvailabilityResponse.builder()
                .seatId(rs.getLong("SEAT_ID"))
                .coachNumber(rs.getString("COACH_NUMBER"))
                .seatNumber(rs.getInt("SEAT_NUMBER"))
                .coachClass(rs.getString("COACH_CLASS"))
                .berthType(rs.getString("BERTH_TYPE"))
                .available(rs.getInt("IS_AVAILABLE") == 1)
                .build(), scheduleId);
    }

    public Seat save(Seat seat) {
        String seqSql = "SELECT SEQ_SEAT_ID.NEXTVAL FROM DUAL";
        Long nextId = jdbcTemplate.queryForObject(seqSql, Long.class);

        String sql = "INSERT INTO SEAT (SEAT_ID, TRAIN_ID, COACH_NUMBER, SEAT_NUMBER, COACH_CLASS, BERTH_TYPE) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, nextId);
            ps.setLong(2, seat.getTrainId());
            ps.setString(3, seat.getCoachNumber());
            ps.setInt(4, seat.getSeatNumber());
            ps.setString(5, seat.getCoachClass());
            ps.setString(6, seat.getBerthType());

            ps.executeUpdate();
            seat.setSeatId(nextId);
            return seat;
        } catch (SQLException e) {
            log.error("Error inserting seat: {}", e.getMessage(), e);
            throw new RuntimeException("Database error saving seat: " + e.getMessage(), e);
        }
    }

    public int update(Seat seat) {
        String sql = "UPDATE SEAT SET TRAIN_ID = ?, COACH_NUMBER = ?, SEAT_NUMBER = ?, COACH_CLASS = ?, BERTH_TYPE = ? " +
                     "WHERE SEAT_ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, seat.getTrainId());
            ps.setString(2, seat.getCoachNumber());
            ps.setInt(3, seat.getSeatNumber());
            ps.setString(4, seat.getCoachClass());
            ps.setString(5, seat.getBerthType());
            ps.setLong(6, seat.getSeatId());

            return ps.executeUpdate();
        } catch (SQLException e) {
            log.error("Error updating seat id {}: {}", seat.getSeatId(), e.getMessage(), e);
            throw new RuntimeException("Database error updating seat: " + e.getMessage(), e);
        }
    }

    public int delete(Long id) {
        String sql = "DELETE FROM SEAT WHERE SEAT_ID = ?";
        return jdbcTemplate.update(sql, id);
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM SEAT";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }
}
