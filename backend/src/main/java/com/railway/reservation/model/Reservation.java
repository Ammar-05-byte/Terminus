package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Domain model matching table RESERVATION.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {
    private Long reservationId;
    private String pnr;
    private Long passengerId;
    private Long scheduleId;
    private Long seatId;
    private Long sourceStationId;
    private Long destinationStationId;
    private LocalDateTime bookingTimestamp;
    private String bookingStatus;
    private BigDecimal fareAmount;
}
