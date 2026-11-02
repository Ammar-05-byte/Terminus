package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.BookingRequest;
import com.railway.reservation.dto.BookingResponse;
import com.railway.reservation.dto.CancellationResponse;
import com.railway.reservation.dto.PaymentRequest;
import com.railway.reservation.dto.ReservationDetailsResponse;
import com.railway.reservation.model.Payment;
import com.railway.reservation.model.Reservation;
import com.railway.reservation.service.PaymentService;
import com.railway.reservation.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Ticket Reservations, Cancellations, and Linked Payment Operations.
 */
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;
    private final PaymentService paymentService;

    public ReservationController(ReservationService reservationService, PaymentService paymentService) {
        this.reservationService = reservationService;
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Reservation>>> getAllReservations() {
        List<Reservation> list = reservationService.getAllReservations();
        return ResponseEntity.ok(ApiResponse.success("Retrieved reservations", list));
    }

    /**
     * Book ticket: Executes stored procedure P_BOOK_TICKET via JDBC CallableStatement.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> bookTicket(@Valid @RequestBody BookingRequest request) {
        BookingResponse response = reservationService.bookTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response.getMessage(), response));
    }

    /**
     * Retrieve complete reservation info by PNR.
     */
    @GetMapping("/pnr/{pnr}")
    public ResponseEntity<ApiResponse<ReservationDetailsResponse>> getReservationByPnr(@PathVariable String pnr) {
        ReservationDetailsResponse details = reservationService.getReservationByPnr(pnr);
        return ResponseEntity.ok(ApiResponse.success("Reservation details retrieved", details));
    }

    /**
     * Cancel reservation: Executes stored procedure P_CANCEL_RESERVATION via JDBC CallableStatement.
     */
    @PostMapping("/{pnr}/cancel")
    public ResponseEntity<ApiResponse<CancellationResponse>> cancelReservation(@PathVariable String pnr) {
        CancellationResponse response = reservationService.cancelReservation(pnr);
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled successfully", response));
    }

    /**
     * Record/retry payment: Executes stored procedure P_RECORD_PAYMENT via JDBC CallableStatement.
     */
    @PostMapping("/{pnr}/payments")
    public ResponseEntity<ApiResponse<Payment>> recordPayment(
            @PathVariable String pnr,
            @Valid @RequestBody PaymentRequest request) {
        Payment payment = paymentService.recordPayment(pnr, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment recorded successfully", payment));
    }

    /**
     * Retrieve payment history for a reservation by PNR.
     */
    @GetMapping("/{pnr}/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByPnr(@PathVariable String pnr) {
        List<Payment> payments = paymentService.getPaymentsByPnr(pnr);
        return ResponseEntity.ok(ApiResponse.success("Retrieved payments for PNR " + pnr, payments));
    }
}
