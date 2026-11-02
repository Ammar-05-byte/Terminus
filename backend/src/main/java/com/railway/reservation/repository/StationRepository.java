package com.railway.reservation.repository;

import com.railway.reservation.model.Station;
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
 * JDBC Repository for STATION table operations.
 * Demonstrates standard SQL operations with Oracle Sequences and PreparedStatement.
 */
@Repository
public class StationRepository {

    private static final Logger log = LoggerFactory.getLogger(StationRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public StationRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Station> stationRowMapper = (rs, rowNum) -> Station.builder()
            .stationId(rs.getLong("STATION_ID"))
            .stationCode(rs.getString("STATION_CODE"))
            .stationName(rs.getString("STATION_NAME"))
            .city(rs.getString("CITY"))
            .state(rs.getString("STATE"))
            .build();

    public List<Station> findAll() {
        String sql = "SELECT STATION_ID, STATION_CODE, STATION_NAME, CITY, STATE " +
                     "FROM STATION ORDER BY STATION_CODE ASC";
        return jdbcTemplate.query(sql, stationRowMapper);
    }

    public Optional<Station> findById(Long id) {
        String sql = "SELECT STATION_ID, STATION_CODE, STATION_NAME, CITY, STATE " +
                     "FROM STATION WHERE STATION_ID = ?";
        List<Station> results = jdbcTemplate.query(sql, stationRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Station> findByCode(String code) {
        String sql = "SELECT STATION_ID, STATION_CODE, STATION_NAME, CITY, STATE " +
                     "FROM STATION WHERE UPPER(STATION_CODE) = UPPER(?)";
        List<Station> results = jdbcTemplate.query(sql, stationRowMapper, code);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Station save(Station station) {
        String seqSql = "SELECT SEQ_STATION_ID.NEXTVAL FROM DUAL";
        Long nextId = jdbcTemplate.queryForObject(seqSql, Long.class);

        String sql = "INSERT INTO STATION (STATION_ID, STATION_CODE, STATION_NAME, CITY, STATE) " +
                     "VALUES (?, UPPER(?), ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, nextId);
            ps.setString(2, station.getStationCode());
            ps.setString(3, station.getStationName());
            ps.setString(4, station.getCity());
            ps.setString(5, station.getState());

            ps.executeUpdate();
            station.setStationId(nextId);
            station.setStationCode(station.getStationCode().toUpperCase());
            return station;
        } catch (SQLException e) {
            log.error("Error inserting station code {}: {}", station.getStationCode(), e.getMessage(), e);
            throw new RuntimeException("Database error saving station: " + e.getMessage(), e);
        }
    }

    public int update(Station station) {
        String sql = "UPDATE STATION SET STATION_CODE = UPPER(?), STATION_NAME = ?, CITY = ?, STATE = ? " +
                     "WHERE STATION_ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, station.getStationCode());
            ps.setString(2, station.getStationName());
            ps.setString(3, station.getCity());
            ps.setString(4, station.getState());
            ps.setLong(5, station.getStationId());

            return ps.executeUpdate();
        } catch (SQLException e) {
            log.error("Error updating station id {}: {}", station.getStationId(), e.getMessage(), e);
            throw new RuntimeException("Database error updating station: " + e.getMessage(), e);
        }
    }

    public int delete(Long id) {
        String sql = "DELETE FROM STATION WHERE STATION_ID = ?";
        return jdbcTemplate.update(sql, id);
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM STATION";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }
}
