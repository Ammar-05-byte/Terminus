package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Domain model matching table PAYMENT.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    private Long paymentId;
    private Long reservationId;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentStatus;
    private String transactionReference;
    private LocalDateTime paymentTimestamp;
}
