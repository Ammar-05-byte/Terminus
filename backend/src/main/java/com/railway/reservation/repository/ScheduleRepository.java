package com.railway.reservation.repository;

import com.railway.reservation.model.TrainSchedule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Repository for TRAIN_SCHEDULE table operations.
 * Demonstrates PreparedStatement and joins with TRAIN and TRAIN_STOP.
 */
@Repository
public class ScheduleRepository {

    private static final Logger log = LoggerFactory.getLogger(ScheduleRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public ScheduleRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<TrainSchedule> scheduleRowMapper = (rs, rowNum) -> TrainSchedule.builder()
            .scheduleId(rs.getLong("SCHEDULE_ID"))
            .trainId(rs.getLong("TRAIN_ID"))
            .trainNumber(rs.getString("TRAIN_NUMBER"))
            .trainName(rs.getString("TRAIN_NAME"))
            .journeyDate(rs.getDate("JOURNEY_DATE").toLocalDate())
            .scheduledDeparture(rs.getTimestamp("SCHEDULED_DEPARTURE") != null ? rs.getTimestamp("SCHEDULED_DEPARTURE").toLocalDateTime() : null)
            .scheduledArrival(rs.getTimestamp("SCHEDULED_ARRIVAL") != null ? rs.getTimestamp("SCHEDULED_ARRIVAL").toLocalDateTime() : null)
            .scheduleStatus(rs.getString("SCHEDULE_STATUS"))
            .build();

    public List<TrainSchedule> findAll() {
        String sql = """
            SELECT
                s.SCHEDULE_ID,
                s.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                s.JOURNEY_DATE,
                s.SCHEDULED_DEPARTURE,
                s.SCHEDULED_ARRIVAL,
                s.SCHEDULE_STATUS
            FROM TRAIN_SCHEDULE s
            JOIN TRAIN t ON s.TRAIN_ID = t.TRAIN_ID
            ORDER BY s.JOURNEY_DATE DESC, s.SCHEDULED_DEPARTURE ASC
            """;
        return jdbcTemplate.query(sql, scheduleRowMapper);
    }

    public Optional<TrainSchedule> findById(Long id) {
        String sql = """
            SELECT
                s.SCHEDULE_ID,
                s.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                s.JOURNEY_DATE,
                s.SCHEDULED_DEPARTURE,
                s.SCHEDULED_ARRIVAL,
                s.SCHEDULE_STATUS
            FROM TRAIN_SCHEDULE s
            JOIN TRAIN t ON s.TRAIN_ID = t.TRAIN_ID
            WHERE s.SCHEDULE_ID = ?
            """;
        List<TrainSchedule> results = jdbcTemplate.query(sql, scheduleRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<TrainSchedule> findByTrainAndDate(Long trainId, LocalDate date) {
        String sql = """
            SELECT
                s.SCHEDULE_ID,
                s.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                s.JOURNEY_DATE,
                s.SCHEDULED_DEPARTURE,
                s.SCHEDULED_ARRIVAL,
                s.SCHEDULE_STATUS
            FROM TRAIN_SCHEDULE s
            JOIN TRAIN t ON s.TRAIN_ID = t.TRAIN_ID
            WHERE s.TRAIN_ID = ? AND s.JOURNEY_DATE = ?
            ORDER BY s.SCHEDULED_DEPARTURE ASC
            """;
        return jdbcTemplate.query(sql, scheduleRowMapper, trainId, Date.valueOf(date));
    }

    public List<TrainSchedule> findUpcomingFromStation(Long stationId) {
        String sql = """
            SELECT DISTINCT
                s.SCHEDULE_ID,
                s.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                s.JOURNEY_DATE,
                s.SCHEDULED_DEPARTURE,
                s.SCHEDULED_ARRIVAL,
                s.SCHEDULE_STATUS
            FROM TRAIN_SCHEDULE s
            JOIN TRAIN t ON s.TRAIN_ID = t.TRAIN_ID
            JOIN TRAIN_STOP stop ON stop.TRAIN_ID = t.TRAIN_ID
            WHERE stop.STATION_ID = ?
              AND s.JOURNEY_DATE >= TRUNC(SYSDATE)
              AND s.SCHEDULE_STATUS != 'CANCELLED'
            ORDER BY s.JOURNEY_DATE ASC, s.SCHEDULED_DEPARTURE ASC
            """;
        return jdbcTemplate.query(sql, scheduleRowMapper, stationId);
    }

    public TrainSchedule save(TrainSchedule schedule) {
        String seqSql = "SELECT SEQ_SCHEDULE_ID.NEXTVAL FROM DUAL";
        Long nextId = jdbcTemplate.queryForObject(seqSql, Long.class);

        String sql = "INSERT INTO TRAIN_SCHEDULE (SCHEDULE_ID, TRAIN_ID, JOURNEY_DATE, SCHEDULED_DEPARTURE, SCHEDULED_ARRIVAL, SCHEDULE_STATUS) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, nextId);
            ps.setLong(2, schedule.getTrainId());
            ps.setDate(3, Date.valueOf(schedule.getJourneyDate()));
            ps.setTimestamp(4, Timestamp.valueOf(schedule.getScheduledDeparture()));
            ps.setTimestamp(5, Timestamp.valueOf(schedule.getScheduledArrival()));
            ps.setString(6, schedule.getScheduleStatus() != null ? schedule.getScheduleStatus() : "SCHEDULED");

            ps.executeUpdate();
            schedule.setScheduleId(nextId);
            return schedule;
        } catch (SQLException e) {
            log.error("Error saving train schedule: {}", e.getMessage(), e);
            throw new RuntimeException("Database error saving train schedule: " + e.getMessage(), e);
        }
    }

    public int update(TrainSchedule schedule) {
        String sql = "UPDATE TRAIN_SCHEDULE SET TRAIN_ID = ?, JOURNEY_DATE = ?, SCHEDULED_DEPARTURE = ?, " +
                     "SCHEDULED_ARRIVAL = ?, SCHEDULE_STATUS = ? WHERE SCHEDULE_ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, schedule.getTrainId());
            ps.setDate(2, Date.valueOf(schedule.getJourneyDate()));
            ps.setTimestamp(3, Timestamp.valueOf(schedule.getScheduledDeparture()));
            ps.setTimestamp(4, Timestamp.valueOf(schedule.getScheduledArrival()));
            ps.setString(5, schedule.getScheduleStatus());
            ps.setLong(6, schedule.getScheduleId());

            return ps.executeUpdate();
        } catch (SQLException e) {
            log.error("Error updating train schedule id {}: {}", schedule.getScheduleId(), e.getMessage(), e);
            throw new RuntimeException("Database error updating train schedule: " + e.getMessage(), e);
        }
    }

    public int delete(Long id) {
        String sql = "DELETE FROM TRAIN_SCHEDULE WHERE SCHEDULE_ID = ?";
        return jdbcTemplate.update(sql, id);
    }

    public int countByDate(LocalDate date) {
        String sql = "SELECT COUNT(*) FROM TRAIN_SCHEDULE WHERE JOURNEY_DATE = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, Date.valueOf(date));
        return count != null ? count : 0;
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM TRAIN_SCHEDULE";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }
}
