package com.railway.reservation.dto;

import com.railway.reservation.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Detailed view of a reservation, combining joined entities and payment history.
 * Corresponds to V_RESERVATION_DETAILS view joined with V_PAYMENT_HISTORY.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationDetailsResponse {
    private Long reservationId;
    private String pnr;
    private LocalDateTime bookingTimestamp;
    private String bookingStatus;
    private BigDecimal fareAmount;

    // Passenger info
    private Long passengerId;
    private String passengerName;
    private String passengerPhone;
    private String passengerEmail;
    private String passengerGender;
    private LocalDate passengerDob;

    // Train info
    private Long trainId;
    private String trainNumber;
    private String trainName;
    private String trainType;

    // Schedule info
    private Long scheduleId;
    private LocalDate journeyDate;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private String scheduleStatus;

    // Seat info
    private Long seatId;
    private String coachNumber;
    private Integer seatNumber;
    private String coachClass;
    private String berthType;

    // Source station
    private Long sourceStationId;
    private String sourceStationName;
    private String sourceStationCode;

    // Destination station
    private Long destinationStationId;
    private String destinationStationName;
    private String destinationStationCode;

    // Associated payments
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}
