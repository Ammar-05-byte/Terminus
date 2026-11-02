package com.railway.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for booking a railway reservation.
 * Maps to stored procedure P_BOOK_TICKET parameters.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    @NotNull(message = "Passenger ID is required")
    private Long passengerId;

    @NotNull(message = "Schedule ID is required")
    private Long scheduleId;

    @NotNull(message = "Source Station ID is required")
    private Long sourceStationId;

    @NotNull(message = "Destination Station ID is required")
    private Long destinationStationId;

    @NotNull(message = "Seat ID is required")
    private Long seatId;

    @NotBlank(message = "Payment method is required (e.g., UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, CASH)")
    private String paymentMethod;

    /**
     * Simulated payment outcome for testing: SUCCESS, PENDING, FAILED
     * Defaults to SUCCESS if omitted.
     */
    @Builder.Default
    private String simulatedPaymentStatus = "SUCCESS";
}
