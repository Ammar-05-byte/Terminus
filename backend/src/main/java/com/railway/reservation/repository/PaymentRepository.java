package com.railway.reservation.repository;

import com.railway.reservation.dto.PaymentRequest;
import com.railway.reservation.exception.DatabaseOperationException;
import com.railway.reservation.model.Payment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Repository for PAYMENT table operations.
 * Demonstrates manual transaction management and CallableStatement call to P_RECORD_PAYMENT.
 */
@Repository
public class PaymentRepository {

    private static final Logger log = LoggerFactory.getLogger(PaymentRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public PaymentRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Payment> paymentRowMapper = (rs, rowNum) -> Payment.builder()
            .paymentId(rs.getLong("PAYMENT_ID"))
            .reservationId(rs.getLong("RESERVATION_ID"))
            .amount(rs.getBigDecimal("AMOUNT"))
            .paymentMethod(rs.getString("PAYMENT_METHOD"))
            .paymentStatus(rs.getString("PAYMENT_STATUS"))
            .transactionReference(rs.getString("TRANSACTION_REFERENCE"))
            .paymentTimestamp(rs.getTimestamp("PAYMENT_TIMESTAMP") != null ? rs.getTimestamp("PAYMENT_TIMESTAMP").toLocalDateTime() : null)
            .build();

    /**
     * Records or retries a payment for an existing reservation using stored procedure P_RECORD_PAYMENT.
     * Transaction: setAutoCommit(false) -> prepareCall -> execute -> commit/rollback.
     */
    public Payment recordPayment(String pnr, PaymentRequest request) {
        String sql = "{CALL P_RECORD_PAYMENT(?, ?, ?, ?, ?, ?, ?, ?)}";
        log.info("Invoking stored procedure P_RECORD_PAYMENT for PNR: {}, amount: {}", pnr, request.getAmount());

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            try (CallableStatement cs = conn.prepareCall(sql)) {
                // IN parameters
                cs.setString(1, pnr);
                cs.setBigDecimal(2, request.getAmount());
                cs.setString(3, request.getPaymentMethod());
                cs.setString(4, request.getPaymentStatus());

                // OUT parameters
                cs.registerOutParameter(5, Types.NUMERIC); // p_payment_id
                cs.registerOutParameter(6, Types.VARCHAR); // p_tx_reference
                cs.registerOutParameter(7, Types.VARCHAR); // p_new_booking_status
                cs.registerOutParameter(8, Types.VARCHAR); // p_result_message

                cs.execute();

                Long paymentId = cs.getLong(5);
                String txRef = cs.getString(6);
                String newStatus = cs.getString(7);
                String resultMessage = cs.getString(8);

                conn.commit();
                log.info("P_RECORD_PAYMENT completed: paymentId={}, txRef={}, newStatus={}, message={}",
                        paymentId, txRef, newStatus, resultMessage);

                return Payment.builder()
                        .paymentId(paymentId)
                        .amount(request.getAmount())
                        .paymentMethod(request.getPaymentMethod())
                        .paymentStatus(request.getPaymentStatus())
                        .transactionReference(txRef)
                        .build();

            } catch (SQLException e) {
                log.error("SQLException in P_RECORD_PAYMENT: {}. Rolling back.", e.getMessage(), e);
                conn.rollback();
                throw new DatabaseOperationException(e.getMessage(), e.getErrorCode(), e);
            }
        } catch (SQLException e) {
            log.error("Transaction error during payment recording: {}", e.getMessage(), e);
            throw new DatabaseOperationException("Connection error during payment: " + e.getMessage(), e.getErrorCode(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    log.warn("Failed to reset autoCommit / close connection: {}", e.getMessage());
                }
            }
        }
    }

    public List<Payment> findByPnr(String pnr) {
        String sql = """
            SELECT
                p.PAYMENT_ID,
                p.RESERVATION_ID,
                p.AMOUNT,
                p.PAYMENT_METHOD,
                p.PAYMENT_STATUS,
                p.TRANSACTION_REFERENCE,
                p.PAYMENT_TIMESTAMP
            FROM PAYMENT p
            JOIN RESERVATION r ON p.RESERVATION_ID = r.RESERVATION_ID
            WHERE UPPER(r.PNR) = UPPER(?)
            ORDER BY p.PAYMENT_TIMESTAMP ASC
            """;
        return jdbcTemplate.query(sql, paymentRowMapper, pnr);
    }

    public List<Payment> findByReservationId(Long reservationId) {
        String sql = """
            SELECT
                PAYMENT_ID,
                RESERVATION_ID,
                AMOUNT,
                PAYMENT_METHOD,
                PAYMENT_STATUS,
                TRANSACTION_REFERENCE,
                PAYMENT_TIMESTAMP
            FROM PAYMENT
            WHERE RESERVATION_ID = ?
            ORDER BY PAYMENT_TIMESTAMP ASC
            """;
        return jdbcTemplate.query(sql, paymentRowMapper, reservationId);
    }

    public List<Payment> findAll() {
        String sql = """
            SELECT
                PAYMENT_ID,
                RESERVATION_ID,
                AMOUNT,
                PAYMENT_METHOD,
                PAYMENT_STATUS,
                TRANSACTION_REFERENCE,
                PAYMENT_TIMESTAMP
            FROM PAYMENT
            ORDER BY PAYMENT_TIMESTAMP DESC
            """;
        return jdbcTemplate.query(sql, paymentRowMapper);
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM PAYMENT";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    public BigDecimal getTotalSuccessfulRevenue() {
        String sql = "SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENT WHERE PAYMENT_STATUS = 'SUCCESS'";
        BigDecimal total = jdbcTemplate.queryForObject(sql, BigDecimal.class);
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal getTotalRefunds() {
        String sql = "SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENT WHERE PAYMENT_STATUS = 'REFUNDED'";
        BigDecimal total = jdbcTemplate.queryForObject(sql, BigDecimal.class);
        return total != null ? total : BigDecimal.ZERO;
    }
}
