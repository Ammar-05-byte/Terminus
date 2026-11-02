package com.railway.reservation.repository;

import com.railway.reservation.dto.BookingRequest;
import com.railway.reservation.dto.BookingResponse;
import com.railway.reservation.dto.CancellationResponse;
import com.railway.reservation.dto.ReservationDetailsResponse;
import com.railway.reservation.exception.DatabaseOperationException;
import com.railway.reservation.model.Payment;
import com.railway.reservation.model.Reservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Repository for RESERVATION table operations.
 * CRITICAL COMPONENT: Demonstrates manual transaction management and CallableStatement
 * calls to Oracle Stored Procedures P_BOOK_TICKET and P_CANCEL_RESERVATION.
 */
@Repository
public class ReservationRepository {

    private static final Logger log = LoggerFactory.getLogger(ReservationRepository.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public ReservationRepository(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Reservation> reservationRowMapper = (rs, rowNum) -> Reservation.builder()
            .reservationId(rs.getLong("RESERVATION_ID"))
            .pnr(rs.getString("PNR"))
            .passengerId(rs.getLong("PASSENGER_ID"))
            .scheduleId(rs.getLong("SCHEDULE_ID"))
            .seatId(rs.getLong("SEAT_ID"))
            .sourceStationId(rs.getLong("SOURCE_STATION_ID"))
            .destinationStationId(rs.getLong("DESTINATION_STATION_ID"))
            .bookingTimestamp(rs.getTimestamp("BOOKING_TIMESTAMP") != null ? rs.getTimestamp("BOOKING_TIMESTAMP").toLocalDateTime() : null)
            .bookingStatus(rs.getString("BOOKING_STATUS"))
            .fareAmount(rs.getBigDecimal("FARE_AMOUNT"))
            .build();

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
     * Books a ticket by calling Oracle stored procedure P_BOOK_TICKET with manual transaction control.
     * Transaction: setAutoCommit(false) -> execute CallableStatement -> commit() or rollback().
     */
    public BookingResponse bookTicket(BookingRequest request) {
        String sql = "{CALL P_BOOK_TICKET(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        log.info("Invoking stored procedure P_BOOK_TICKET for passenger={}, schedule={}, seat={}",
                request.getPassengerId(), request.getScheduleId(), request.getSeatId());

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            // 1. Disable auto-commit to begin manual transaction
            conn.setAutoCommit(false);

            try (CallableStatement cs = conn.prepareCall(sql)) {
                // Set IN parameters
                cs.setLong(1, request.getPassengerId());
                cs.setLong(2, request.getScheduleId());
                cs.setLong(3, request.getSourceStationId());
                cs.setLong(4, request.getDestinationStationId());
                cs.setLong(5, request.getSeatId());
                cs.setString(6, request.getPaymentMethod());
                cs.setString(7, request.getSimulatedPaymentStatus() != null ? request.getSimulatedPaymentStatus() : "SUCCESS");

                // Register OUT parameters
                cs.registerOutParameter(8, Types.NUMERIC); // p_reservation_id
                cs.registerOutParameter(9, Types.VARCHAR); // p_pnr
                cs.registerOutParameter(10, Types.NUMERIC); // p_fare_amount
                cs.registerOutParameter(11, Types.VARCHAR); // p_booking_status

                // Execute procedure
                cs.execute();

                Long reservationId = cs.getLong(8);
                String pnr = cs.getString(9);
                BigDecimal fare = cs.getBigDecimal(10);
                String status = cs.getString(11);

                // 2. Commit transaction upon successful procedure execution
                conn.commit();
                log.info("P_BOOK_TICKET executed successfully. PNR={}, ReservationId={}, Status={}, Fare={}",
                        pnr, reservationId, status, fare);

                return BookingResponse.builder()
                        .reservationId(reservationId)
                        .pnr(pnr)
                        .fareAmount(fare)
                        .bookingStatus(status)
                        .paymentStatus(request.getSimulatedPaymentStatus())
                        .message("Booking processed successfully with status: " + status)
                        .build();

            } catch (SQLException e) {
                // 3. Rollback on failure
                log.error("SQLException in P_BOOK_TICKET. Rolling back transaction: {}", e.getMessage(), e);
                conn.rollback();
                throw new DatabaseOperationException(e.getMessage(), e.getErrorCode(), e);
            }
        } catch (SQLException e) {
            log.error("Connection or transaction error during booking: {}", e.getMessage(), e);
            throw new DatabaseOperationException("Connection error during booking: " + e.getMessage(), e.getErrorCode(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    log.warn("Failed to reset auto-commit / close connection: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * Cancels an existing reservation by calling Oracle stored procedure P_CANCEL_RESERVATION.
     * Transaction: setAutoCommit(false) -> execute CallableStatement -> commit() or rollback().
     */
    public CancellationResponse cancelReservation(String pnr) {
        String sql = "{CALL P_CANCEL_RESERVATION(?, ?, ?, ?, ?)}";
        log.info("Invoking stored procedure P_CANCEL_RESERVATION for PNR: {}", pnr);

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            try (CallableStatement cs = conn.prepareCall(sql)) {
                // Set IN parameter
                cs.setString(1, pnr);

                // Register OUT parameters
                cs.registerOutParameter(2, Types.VARCHAR); // p_result
                cs.registerOutParameter(3, Types.VARCHAR); // p_booking_status
                cs.registerOutParameter(4, Types.NUMERIC); // p_refund_amount
                cs.registerOutParameter(5, Types.VARCHAR); // p_transaction_reference

                cs.execute();

                String result = cs.getString(2);
                String bookingStatus = cs.getString(3);
                BigDecimal refundAmount = cs.getBigDecimal(4);
                String txRef = cs.getString(5);

                conn.commit();
                log.info("P_CANCEL_RESERVATION completed. PNR={}, Status={}, Refund={}, TxRef={}",
                        pnr, bookingStatus, refundAmount, txRef);

                return CancellationResponse.builder()
                        .result(result)
                        .bookingStatus(bookingStatus)
                        .refundAmount(refundAmount)
                        .transactionReference(txRef)
                        .build();

            } catch (SQLException e) {
                log.error("SQLException in P_CANCEL_RESERVATION. Rolling back transaction: {}", e.getMessage(), e);
                conn.rollback();
                throw new DatabaseOperationException(e.getMessage(), e.getErrorCode(), e);
            }
        } catch (SQLException e) {
            log.error("Connection or transaction error during cancellation: {}", e.getMessage(), e);
            throw new DatabaseOperationException("Connection error during cancellation: " + e.getMessage(), e.getErrorCode(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    log.warn("Failed to reset auto-commit / close connection: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * Retrieves comprehensive reservation details by PNR with joined tables and payment history.
     */
    public Optional<ReservationDetailsResponse> findByPnr(String pnr) {
        String sql = """
            SELECT
                r.RESERVATION_ID,
                r.PNR,
                r.BOOKING_TIMESTAMP,
                r.BOOKING_STATUS,
                r.FARE_AMOUNT,
                p.PASSENGER_ID,
                p.FULL_NAME AS PASSENGER_NAME,
                p.PHONE AS PASSENGER_PHONE,
                p.EMAIL AS PASSENGER_EMAIL,
                p.GENDER AS PASSENGER_GENDER,
                p.DATE_OF_BIRTH AS PASSENGER_DOB,
                t.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                t.TRAIN_TYPE,
                sch.SCHEDULE_ID,
                sch.JOURNEY_DATE,
                sch.SCHEDULED_DEPARTURE,
                sch.SCHEDULED_ARRIVAL,
                sch.SCHEDULE_STATUS,
                st.SEAT_ID,
                st.COACH_NUMBER,
                st.SEAT_NUMBER,
                st.COACH_CLASS,
                st.BERTH_TYPE,
                src.STATION_ID AS SRC_STATION_ID,
                src.STATION_NAME AS SRC_STATION_NAME,
                src.STATION_CODE AS SRC_STATION_CODE,
                dst.STATION_ID AS DST_STATION_ID,
                dst.STATION_NAME AS DST_STATION_NAME,
                dst.STATION_CODE AS DST_STATION_CODE
            FROM RESERVATION r
            JOIN PASSENGER p ON r.PASSENGER_ID = p.PASSENGER_ID
            JOIN TRAIN_SCHEDULE sch ON r.SCHEDULE_ID = sch.SCHEDULE_ID
            JOIN TRAIN t ON sch.TRAIN_ID = t.TRAIN_ID
            JOIN SEAT st ON r.SEAT_ID = st.SEAT_ID
            JOIN STATION src ON r.SOURCE_STATION_ID = src.STATION_ID
            JOIN STATION dst ON r.DESTINATION_STATION_ID = dst.STATION_ID
            WHERE UPPER(r.PNR) = UPPER(?)
            """;

        List<ReservationDetailsResponse> list = jdbcTemplate.query(sql, (rs, rowNum) -> ReservationDetailsResponse.builder()
                .reservationId(rs.getLong("RESERVATION_ID"))
                .pnr(rs.getString("PNR"))
                .bookingTimestamp(rs.getTimestamp("BOOKING_TIMESTAMP") != null ? rs.getTimestamp("BOOKING_TIMESTAMP").toLocalDateTime() : null)
                .bookingStatus(rs.getString("BOOKING_STATUS"))
                .fareAmount(rs.getBigDecimal("FARE_AMOUNT"))
                .passengerId(rs.getLong("PASSENGER_ID"))
                .passengerName(rs.getString("PASSENGER_NAME"))
                .passengerPhone(rs.getString("PASSENGER_PHONE"))
                .passengerEmail(rs.getString("PASSENGER_EMAIL"))
                .passengerGender(rs.getString("PASSENGER_GENDER"))
                .passengerDob(rs.getDate("PASSENGER_DOB") != null ? rs.getDate("PASSENGER_DOB").toLocalDate() : null)
                .trainId(rs.getLong("TRAIN_ID"))
                .trainNumber(rs.getString("TRAIN_NUMBER"))
                .trainName(rs.getString("TRAIN_NAME"))
                .trainType(rs.getString("TRAIN_TYPE"))
                .scheduleId(rs.getLong("SCHEDULE_ID"))
                .journeyDate(rs.getDate("JOURNEY_DATE").toLocalDate())
                .scheduledDeparture(rs.getTimestamp("SCHEDULED_DEPARTURE") != null ? rs.getTimestamp("SCHEDULED_DEPARTURE").toLocalDateTime() : null)
                .scheduledArrival(rs.getTimestamp("SCHEDULED_ARRIVAL") != null ? rs.getTimestamp("SCHEDULED_ARRIVAL").toLocalDateTime() : null)
                .scheduleStatus(rs.getString("SCHEDULE_STATUS"))
                .seatId(rs.getLong("SEAT_ID"))
                .coachNumber(rs.getString("COACH_NUMBER"))
                .seatNumber(rs.getInt("SEAT_NUMBER"))
                .coachClass(rs.getString("COACH_CLASS"))
                .berthType(rs.getString("BERTH_TYPE"))
                .sourceStationId(rs.getLong("SRC_STATION_ID"))
                .sourceStationName(rs.getString("SRC_STATION_NAME"))
                .sourceStationCode(rs.getString("SRC_STATION_CODE"))
                .destinationStationId(rs.getLong("DST_STATION_ID"))
                .destinationStationName(rs.getString("DST_STATION_NAME"))
                .destinationStationCode(rs.getString("DST_STATION_CODE"))
                .payments(new ArrayList<>())
                .build(), pnr);

        if (list.isEmpty()) {
            return Optional.empty();
        }

        ReservationDetailsResponse details = list.get(0);

        // Fetch associated payments
        String paySql = "SELECT PAYMENT_ID, RESERVATION_ID, AMOUNT, PAYMENT_METHOD, PAYMENT_STATUS, " +
                        "TRANSACTION_REFERENCE, PAYMENT_TIMESTAMP FROM PAYMENT WHERE RESERVATION_ID = ? ORDER BY PAYMENT_TIMESTAMP ASC";
        List<Payment> payments = jdbcTemplate.query(paySql, paymentRowMapper, details.getReservationId());
        details.setPayments(payments);

        return Optional.of(details);
    }

    /**
     * Retrieves all reservations made by a passenger.
     */
    public List<ReservationDetailsResponse> findByPassengerId(Long passengerId) {
        String sql = """
            SELECT
                r.RESERVATION_ID,
                r.PNR,
                r.BOOKING_TIMESTAMP,
                r.BOOKING_STATUS,
                r.FARE_AMOUNT,
                p.PASSENGER_ID,
                p.FULL_NAME AS PASSENGER_NAME,
                p.PHONE AS PASSENGER_PHONE,
                p.EMAIL AS PASSENGER_EMAIL,
                p.GENDER AS PASSENGER_GENDER,
                p.DATE_OF_BIRTH AS PASSENGER_DOB,
                t.TRAIN_ID,
                t.TRAIN_NUMBER,
                t.TRAIN_NAME,
                t.TRAIN_TYPE,
                sch.SCHEDULE_ID,
                sch.JOURNEY_DATE,
                sch.SCHEDULED_DEPARTURE,
                sch.SCHEDULED_ARRIVAL,
                sch.SCHEDULE_STATUS,
                st.SEAT_ID,
                st.COACH_NUMBER,
                st.SEAT_NUMBER,
                st.COACH_CLASS,
                st.BERTH_TYPE,
                src.STATION_ID AS SRC_STATION_ID,
                src.STATION_NAME AS SRC_STATION_NAME,
                src.STATION_CODE AS SRC_STATION_CODE,
                dst.STATION_ID AS DST_STATION_ID,
                dst.STATION_NAME AS DST_STATION_NAME,
                dst.STATION_CODE AS DST_STATION_CODE
            FROM RESERVATION r
            JOIN PASSENGER p ON r.PASSENGER_ID = p.PASSENGER_ID
            JOIN TRAIN_SCHEDULE sch ON r.SCHEDULE_ID = sch.SCHEDULE_ID
            JOIN TRAIN t ON sch.TRAIN_ID = t.TRAIN_ID
            JOIN SEAT st ON r.SEAT_ID = st.SEAT_ID
            JOIN STATION src ON r.SOURCE_STATION_ID = src.STATION_ID
            JOIN STATION dst ON r.DESTINATION_STATION_ID = dst.STATION_ID
            WHERE r.PASSENGER_ID = ?
            ORDER BY r.BOOKING_TIMESTAMP DESC
            """;

        List<ReservationDetailsResponse> list = jdbcTemplate.query(sql, (rs, rowNum) -> ReservationDetailsResponse.builder()
                .reservationId(rs.getLong("RESERVATION_ID"))
                .pnr(rs.getString("PNR"))
                .bookingTimestamp(rs.getTimestamp("BOOKING_TIMESTAMP") != null ? rs.getTimestamp("BOOKING_TIMESTAMP").toLocalDateTime() : null)
                .bookingStatus(rs.getString("BOOKING_STATUS"))
                .fareAmount(rs.getBigDecimal("FARE_AMOUNT"))
                .passengerId(rs.getLong("PASSENGER_ID"))
                .passengerName(rs.getString("PASSENGER_NAME"))
                .passengerPhone(rs.getString("PASSENGER_PHONE"))
                .passengerEmail(rs.getString("PASSENGER_EMAIL"))
                .passengerGender(rs.getString("PASSENGER_GENDER"))
                .passengerDob(rs.getDate("PASSENGER_DOB") != null ? rs.getDate("PASSENGER_DOB").toLocalDate() : null)
                .trainId(rs.getLong("TRAIN_ID"))
                .trainNumber(rs.getString("TRAIN_NUMBER"))
                .trainName(rs.getString("TRAIN_NAME"))
                .trainType(rs.getString("TRAIN_TYPE"))
                .scheduleId(rs.getLong("SCHEDULE_ID"))
                .journeyDate(rs.getDate("JOURNEY_DATE").toLocalDate())
                .scheduledDeparture(rs.getTimestamp("SCHEDULED_DEPARTURE") != null ? rs.getTimestamp("SCHEDULED_DEPARTURE").toLocalDateTime() : null)
                .scheduledArrival(rs.getTimestamp("SCHEDULED_ARRIVAL") != null ? rs.getTimestamp("SCHEDULED_ARRIVAL").toLocalDateTime() : null)
                .scheduleStatus(rs.getString("SCHEDULE_STATUS"))
                .seatId(rs.getLong("SEAT_ID"))
                .coachNumber(rs.getString("COACH_NUMBER"))
                .seatNumber(rs.getInt("SEAT_NUMBER"))
                .coachClass(rs.getString("COACH_CLASS"))
                .berthType(rs.getString("BERTH_TYPE"))
                .sourceStationId(rs.getLong("SRC_STATION_ID"))
                .sourceStationName(rs.getString("SRC_STATION_NAME"))
                .sourceStationCode(rs.getString("SRC_STATION_CODE"))
                .destinationStationId(rs.getLong("DST_STATION_ID"))
                .destinationStationName(rs.getString("DST_STATION_NAME"))
                .destinationStationCode(rs.getString("DST_STATION_CODE"))
                .payments(new ArrayList<>())
                .build(), passengerId);

        // Fetch payments for each
        for (ReservationDetailsResponse res : list) {
            String paySql = "SELECT PAYMENT_ID, RESERVATION_ID, AMOUNT, PAYMENT_METHOD, PAYMENT_STATUS, " +
                            "TRANSACTION_REFERENCE, PAYMENT_TIMESTAMP FROM PAYMENT WHERE RESERVATION_ID = ? ORDER BY PAYMENT_TIMESTAMP ASC";
            res.setPayments(jdbcTemplate.query(paySql, paymentRowMapper, res.getReservationId()));
        }

        return list;
    }

    public List<Reservation> findAll() {
        String sql = "SELECT RESERVATION_ID, PNR, PASSENGER_ID, SCHEDULE_ID, SEAT_ID, " +
                     "SOURCE_STATION_ID, DESTINATION_STATION_ID, BOOKING_TIMESTAMP, BOOKING_STATUS, FARE_AMOUNT " +
                     "FROM RESERVATION ORDER BY BOOKING_TIMESTAMP DESC";
        return jdbcTemplate.query(sql, reservationRowMapper);
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM RESERVATION";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    public long countByStatus(String status) {
        String sql = "SELECT COUNT(*) FROM RESERVATION WHERE UPPER(BOOKING_STATUS) = UPPER(?)";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, status);
        return count != null ? count : 0L;
    }
}
