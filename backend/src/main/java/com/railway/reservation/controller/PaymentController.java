package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.model.Payment;
import com.railway.reservation.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Payment Auditing and Inquiry.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.success("Retrieved payments", payments));
    }

    @GetMapping("/pnr/{pnr}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByPnr(@PathVariable String pnr) {
        List<Payment> payments = paymentService.getPaymentsByPnr(pnr);
        return ResponseEntity.ok(ApiResponse.success("Retrieved payments for PNR " + pnr, payments));
    }

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByReservationId(@PathVariable Long reservationId) {
        List<Payment> payments = paymentService.getPaymentsByReservationId(reservationId);
        return ResponseEntity.ok(ApiResponse.success("Retrieved payments for reservation " + reservationId, payments));
    }
}
