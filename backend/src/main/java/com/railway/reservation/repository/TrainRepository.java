package com.railway.reservation.repository;

import com.railway.reservation.dto.TrainSearchResponse;
import com.railway.reservation.model.Train;
import com.railway.reservation.model.TrainStop;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Repository for TRAIN and TRAIN_STOP table operations.
 * Implements complex joins, route lookups, and multi-station search matching Query Q01.
 */
@Repository
public class TrainRepository {

    private static final Logger log = LoggerFactory.getLogger(TrainRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public TrainRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Train> trainRowMapper = (rs, rowNum) -> Train.builder()
            .trainId(rs.getLong("TRAIN_ID"))
            .trainNumber(rs.getString("TRAIN_NUMBER"))
            .trainName(rs.getString("TRAIN_NAME"))
            .trainType(rs.getString("TRAIN_TYPE"))
            .activeStatus(rs.getString("ACTIVE_STATUS"))
            .build();

    private final RowMapper<TrainStop> trainStopRowMapper = (rs, rowNum) -> TrainStop.builder()
            .trainId(rs.getLong("TRAIN_ID"))
            .stopSequence(rs.getInt("STOP_SEQUENCE"))
            .stationId(rs.getLong("STATION_ID"))
            .stationName(rs.getString("STATION_NAME"))
            .stationCode(rs.getString("STATION_CODE"))
            .arrivalTime(rs.getString("ARRIVAL_TIME"))
            .departureTime(rs.getString("DEPARTURE_TIME"))
            .distanceFromOriginKm(rs.getBigDecimal("DISTANCE_FROM_ORIGIN_KM"))
            .build();

    public List<Train> findAll() {
        String sql = "SELECT TRAIN_ID, TRAIN_NUMBER, TRAIN_NAME, TRAIN_TYPE, ACTIVE_STATUS " +
                     "FROM TRAIN ORDER BY TRAIN_NUMBER ASC";
        return jdbcTemplate.query(sql, trainRowMapper);
    }

    public Optional<Train> findById(Long id) {
        String sql = "SELECT TRAIN_ID, TRAIN_NUMBER, TRAIN_NAME, TRAIN_TYPE, ACTIVE_STATUS " +
                     "FROM TRAIN WHERE TRAIN_ID = ?";
        List<Train> results = jdbcTemplate.query(sql, trainRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Train> findByNumber(String trainNumber) {
        String sql = "SELECT TRAIN_ID, TRAIN_NUMBER, TRAIN_NAME, TRAIN_TYPE, ACTIVE_STATUS " +
                     "FROM TRAIN WHERE TRAIN_NUMBER = ?";
        List<Train> results = jdbcTemplate.query(sql, trainRowMapper, trainNumber);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Search trains running between source and destination stations on a given journey date.
     * Implements Q01 with seat availability subquery.
     */
    public List<TrainSearchResponse> searchTrains(Long sourceStationId, Long destStationId, LocalDate journeyDate) {
        String sql = """
            SELECT
                t.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                t.TRAIN_TYPE,
                ts.SCHEDULE_ID,
                ts.JOURNEY_DATE,
                ts.SCHEDULED_DEPARTURE,
                ts.SCHEDULED_ARRIVAL,
                s1.STATION_ID AS SRC_ID,
                s1.STATION_CODE AS SRC_CODE,
                s1.STATION_NAME AS SRC_NAME,
                stop1.DEPARTURE_TIME AS SRC_DEP_TIME,
                s2.STATION_ID AS DST_ID,
                s2.STATION_CODE AS DST_CODE,
                s2.STATION_NAME AS DST_NAME,
                stop2.ARRIVAL_TIME AS DST_ARR_TIME,
                (SELECT COUNT(*) FROM SEAT st
                 WHERE st.TRAIN_ID = t.TRAIN_ID
                   AND st.SEAT_ID NOT IN (
                       SELECT r.SEAT_ID FROM RESERVATION r
                       WHERE r.SCHEDULE_ID = ts.SCHEDULE_ID
                         AND r.BOOKING_STATUS IN ('CONFIRMED', 'PENDING')
                   )) AS AVAILABLE_SEATS
            FROM TRAIN_SCHEDULE ts
            JOIN TRAIN t ON ts.TRAIN_ID = t.TRAIN_ID
            JOIN TRAIN_STOP stop1 ON stop1.TRAIN_ID = t.TRAIN_ID AND stop1.STATION_ID = ?
            JOIN STATION s1 ON s1.STATION_ID = stop1.STATION_ID
            JOIN TRAIN_STOP stop2 ON stop2.TRAIN_ID = t.TRAIN_ID AND stop2.STATION_ID = ?
            JOIN STATION s2 ON s2.STATION_ID = stop2.STATION_ID
            WHERE stop1.STOP_SEQUENCE < stop2.STOP_SEQUENCE
              AND ts.JOURNEY_DATE = ?
              AND t.ACTIVE_STATUS = 'ACTIVE'
              AND ts.SCHEDULE_STATUS != 'CANCELLED'
            ORDER BY ts.SCHEDULED_DEPARTURE ASC
            """;

        log.debug("Executing searchTrains Q01 query: src={}, dst={}, date={}", sourceStationId, destStationId, journeyDate);

        return jdbcTemplate.query(sql, (rs, rowNum) -> TrainSearchResponse.builder()
                .trainId(rs.getLong("TRAIN_ID"))
                .trainNumber(rs.getString("TRAIN_NUMBER"))
                .trainName(rs.getString("TRAIN_NAME"))
                .trainType(rs.getString("TRAIN_TYPE"))
                .scheduleId(rs.getLong("SCHEDULE_ID"))
                .journeyDate(rs.getDate("JOURNEY_DATE").toLocalDate())
                .scheduledDeparture(rs.getTimestamp("SCHEDULED_DEPARTURE") != null ? rs.getTimestamp("SCHEDULED_DEPARTURE").toLocalDateTime() : null)
                .scheduledArrival(rs.getTimestamp("SCHEDULED_ARRIVAL") != null ? rs.getTimestamp("SCHEDULED_ARRIVAL").toLocalDateTime() : null)
                .sourceDepartureTime(rs.getString("SRC_DEP_TIME"))
                .destArrivalTime(rs.getString("DST_ARR_TIME"))
                .sourceStationId(rs.getLong("SRC_ID"))
                .sourceStationCode(rs.getString("SRC_CODE"))
                .sourceStationName(rs.getString("SRC_NAME"))
                .destinationStationId(rs.getLong("DST_ID"))
                .destinationStationCode(rs.getString("DST_CODE"))
                .destinationStationName(rs.getString("DST_NAME"))
                .availableSeats(rs.getInt("AVAILABLE_SEATS"))
                .build(),
                sourceStationId, destStationId, Date.valueOf(journeyDate));
    }

    /**
     * Retrieve complete ordered route stops for a train.
     */
    public List<TrainStop> findTrainRoute(Long trainId) {
        String sql = """
            SELECT
                ts.TRAIN_ID,
                ts.STOP_SEQUENCE,
                ts.STATION_ID,
                s.STATION_NAME,
                s.STATION_CODE,
                ts.ARRIVAL_TIME,
                ts.DEPARTURE_TIME,
                ts.DISTANCE_FROM_ORIGIN_KM
            FROM TRAIN_STOP ts
            JOIN STATION s ON ts.STATION_ID = s.STATION_ID
            WHERE ts.TRAIN_ID = ?
            ORDER BY ts.STOP_SEQUENCE ASC
            """;
        return jdbcTemplate.query(sql, trainStopRowMapper, trainId);
    }

    public Train save(Train train) {
        String seqSql = "SELECT SEQ_TRAIN_ID.NEXTVAL FROM DUAL";
        Long nextId = jdbcTemplate.queryForObject(seqSql, Long.class);

        String sql = "INSERT INTO TRAIN (TRAIN_ID, TRAIN_NUMBER, TRAIN_NAME, TRAIN_TYPE, ACTIVE_STATUS) " +
                     "VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, nextId);
            ps.setString(2, train.getTrainNumber());
            ps.setString(3, train.getTrainName());
            ps.setString(4, train.getTrainType());
            ps.setString(5, train.getActiveStatus() != null ? train.getActiveStatus() : "ACTIVE");

            ps.executeUpdate();
            train.setTrainId(nextId);
            return train;
        } catch (SQLException e) {
            log.error("Error inserting train: {}", e.getMessage(), e);
            throw new RuntimeException("Database error saving train: " + e.getMessage(), e);
        }
    }

    public int update(Train train) {
        String sql = "UPDATE TRAIN SET TRAIN_NUMBER = ?, TRAIN_NAME = ?, TRAIN_TYPE = ?, ACTIVE_STATUS = ? " +
                     "WHERE TRAIN_ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, train.getTrainNumber());
            ps.setString(2, train.getTrainName());
            ps.setString(3, train.getTrainType());
            ps.setString(4, train.getActiveStatus());
            ps.setLong(5, train.getTrainId());

            return ps.executeUpdate();
        } catch (SQLException e) {
            log.error("Error updating train id {}: {}", train.getTrainId(), e.getMessage(), e);
            throw new RuntimeException("Database error updating train: " + e.getMessage(), e);
        }
    }

    public int delete(Long id) {
        // Cascade delete stops first
        jdbcTemplate.update("DELETE FROM TRAIN_STOP WHERE TRAIN_ID = ?", id);
        return jdbcTemplate.update("DELETE FROM TRAIN WHERE TRAIN_ID = ?", id);
    }

    public void addTrainStop(TrainStop stop) {
        String sql = "INSERT INTO TRAIN_STOP (TRAIN_ID, STOP_SEQUENCE, STATION_ID, ARRIVAL_TIME, DEPARTURE_TIME, DISTANCE_FROM_ORIGIN_KM) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                stop.getTrainId(),
                stop.getStopSequence(),
                stop.getStationId(),
                stop.getArrivalTime(),
                stop.getDepartureTime(),
                stop.getDistanceFromOriginKm());
    }

    public void deleteTrainStops(Long trainId) {
        jdbcTemplate.update("DELETE FROM TRAIN_STOP WHERE TRAIN_ID = ?", trainId);
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM TRAIN";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }
}
