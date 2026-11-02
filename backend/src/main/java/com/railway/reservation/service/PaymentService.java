package com.railway.reservation.service;

import com.railway.reservation.dto.PaymentRequest;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Payment;
import com.railway.reservation.repository.PaymentRepository;
import com.railway.reservation.repository.ReservationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service managing Payments and financial transactions.
 */
@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          ReservationRepository reservationRepository) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
    }

    public Payment recordPayment(String pnr, PaymentRequest request) {
        reservationRepository.findByPnr(pnr)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "PNR", pnr));

        return paymentRepository.recordPayment(pnr, request);
    }

    public List<Payment> getPaymentsByPnr(String pnr) {
        reservationRepository.findByPnr(pnr)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "PNR", pnr));

        return paymentRepository.findByPnr(pnr);
    }

    public List<Payment> getPaymentsByReservationId(Long reservationId) {
        return paymentRepository.findByReservationId(reservationId);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}
