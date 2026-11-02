package com.railway.reservation.repository;

import com.railway.reservation.model.Passenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Repository for PASSENGER table operations.
 * Demonstrates PreparedStatement, RowMapper, and explicit sequence handling in Oracle.
 */
@Repository
public class PassengerRepository {

    private static final Logger log = LoggerFactory.getLogger(PassengerRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public PassengerRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Passenger> passengerRowMapper = (rs, rowNum) -> Passenger.builder()
            .passengerId(rs.getLong("PASSENGER_ID"))
            .fullName(rs.getString("FULL_NAME"))
            .dateOfBirth(rs.getDate("DATE_OF_BIRTH") != null ? rs.getDate("DATE_OF_BIRTH").toLocalDate() : null)
            .gender(rs.getString("GENDER"))
            .phone(rs.getString("PHONE"))
            .email(rs.getString("EMAIL"))
            .build();

    public List<Passenger> findAll() {
        String sql = "SELECT PASSENGER_ID, FULL_NAME, DATE_OF_BIRTH, GENDER, PHONE, EMAIL " +
                     "FROM PASSENGER ORDER BY PASSENGER_ID ASC";
        log.debug("Executing findAll passengers query: {}", sql);
        return jdbcTemplate.query(sql, passengerRowMapper);
    }

    public Optional<Passenger> findById(Long id) {
        String sql = "SELECT PASSENGER_ID, FULL_NAME, DATE_OF_BIRTH, GENDER, PHONE, EMAIL " +
                     "FROM PASSENGER WHERE PASSENGER_ID = ?";
        log.debug("Executing findById query for id={}: {}", id, sql);
        List<Passenger> results = jdbcTemplate.query(sql, passengerRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Passenger> findByPhone(String phone) {
        String sql = "SELECT PASSENGER_ID, FULL_NAME, DATE_OF_BIRTH, GENDER, PHONE, EMAIL " +
                     "FROM PASSENGER WHERE PHONE = ?";
        List<Passenger> results = jdbcTemplate.query(sql, passengerRowMapper, phone);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<Passenger> findByEmail(String email) {
        String sql = "SELECT PASSENGER_ID, FULL_NAME, DATE_OF_BIRTH, GENDER, PHONE, EMAIL " +
                     "FROM PASSENGER WHERE LOWER(EMAIL) = LOWER(?)";
        List<Passenger> results = jdbcTemplate.query(sql, passengerRowMapper, email);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Saves a new Passenger using direct JDBC Connection and PreparedStatement.
     * Sequences: SEQ_PASSENGER_ID.NEXTVAL
     */
    public Passenger save(Passenger passenger) {
        String seqSql = "SELECT SEQ_PASSENGER_ID.NEXTVAL FROM DUAL";
        Long nextId = jdbcTemplate.queryForObject(seqSql, Long.class);

        String sql = "INSERT INTO PASSENGER (PASSENGER_ID, FULL_NAME, DATE_OF_BIRTH, GENDER, PHONE, EMAIL) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, nextId);
            ps.setString(2, passenger.getFullName());
            ps.setDate(3, passenger.getDateOfBirth() != null ? Date.valueOf(passenger.getDateOfBirth()) : null);
            ps.setString(4, passenger.getGender());
            ps.setString(5, passenger.getPhone());
            ps.setString(6, passenger.getEmail());

            int rowsAffected = ps.executeUpdate();
            log.debug("Inserted passenger id={}, rowsAffected={}", nextId, rowsAffected);
            passenger.setPassengerId(nextId);
            return passenger;
        } catch (SQLException e) {
            log.error("Failed to insert passenger into Oracle: {}", e.getMessage(), e);
            throw new RuntimeException("Database error saving passenger: " + e.getMessage(), e);
        }
    }

    public int update(Passenger passenger) {
        String sql = "UPDATE PASSENGER SET FULL_NAME = ?, DATE_OF_BIRTH = ?, GENDER = ?, PHONE = ?, EMAIL = ? " +
                     "WHERE PASSENGER_ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, passenger.getFullName());
            ps.setDate(2, passenger.getDateOfBirth() != null ? Date.valueOf(passenger.getDateOfBirth()) : null);
            ps.setString(3, passenger.getGender());
            ps.setString(4, passenger.getPhone());
            ps.setString(5, passenger.getEmail());
            ps.setLong(6, passenger.getPassengerId());

            return ps.executeUpdate();
        } catch (SQLException e) {
            log.error("Failed to update passenger id={}: {}", passenger.getPassengerId(), e.getMessage(), e);
            throw new RuntimeException("Database error updating passenger: " + e.getMessage(), e);
        }
    }

    public int delete(Long id) {
        String sql = "DELETE FROM PASSENGER WHERE PASSENGER_ID = ?";
        return jdbcTemplate.update(sql, id);
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM PASSENGER";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }
}
