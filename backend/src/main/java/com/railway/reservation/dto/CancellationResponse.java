package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response payload returned after calling P_CANCEL_RESERVATION.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancellationResponse {
    private String result;
    private String bookingStatus;
    private BigDecimal refundAmount;
    private String transactionReference;
}
