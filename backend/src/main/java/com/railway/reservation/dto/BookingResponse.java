package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response payload returned after calling P_BOOK_TICKET.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Long reservationId;
    private String pnr;
    private BigDecimal fareAmount;
    private String bookingStatus;
    private String paymentStatus;
    private String message;
}
