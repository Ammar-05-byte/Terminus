package com.railway.reservation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request payload for recording/retrying payment on an existing reservation.
 * Maps to stored procedure P_RECORD_PAYMENT.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Payment method is required (e.g. UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, CASH)")
    private String paymentMethod;

    @NotBlank(message = "Payment status is required (e.g. SUCCESS, PENDING, FAILED)")
    private String paymentStatus;
}
