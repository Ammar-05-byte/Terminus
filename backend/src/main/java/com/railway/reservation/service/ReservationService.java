package com.railway.reservation.service;

import com.railway.reservation.dto.BookingRequest;
import com.railway.reservation.dto.BookingResponse;
import com.railway.reservation.dto.CancellationResponse;
import com.railway.reservation.dto.ReservationDetailsResponse;
import com.railway.reservation.exception.BusinessException;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Reservation;
import com.railway.reservation.repository.PassengerRepository;
import com.railway.reservation.repository.ReservationRepository;
import com.railway.reservation.repository.ScheduleRepository;
import com.railway.reservation.repository.SeatRepository;
import com.railway.reservation.repository.StationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service managing Reservations and booking orchestration.
 */
@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final PassengerRepository passengerRepository;
    private final ScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;
    private final StationRepository stationRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              PassengerRepository passengerRepository,
                              ScheduleRepository scheduleRepository,
                              SeatRepository seatRepository,
                              StationRepository stationRepository) {
        this.reservationRepository = reservationRepository;
        this.passengerRepository = passengerRepository;
        this.scheduleRepository = scheduleRepository;
        this.seatRepository = seatRepository;
        this.stationRepository = stationRepository;
    }

    public BookingResponse bookTicket(BookingRequest request) {
        // Pre-validation of references
        passengerRepository.findById(request.getPassengerId())
                .orElseThrow(() -> new ResourceNotFoundException("Passenger", "id", request.getPassengerId()));

        scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("TrainSchedule", "id", request.getScheduleId()));

        seatRepository.findById(request.getSeatId())
                .orElseThrow(() -> new ResourceNotFoundException("Seat", "id", request.getSeatId()));

        stationRepository.findById(request.getSourceStationId())
                .orElseThrow(() -> new ResourceNotFoundException("Source Station", "id", request.getSourceStationId()));

        stationRepository.findById(request.getDestinationStationId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination Station", "id", request.getDestinationStationId()));

        if (request.getSourceStationId().equals(request.getDestinationStationId())) {
            throw new BusinessException("Source and destination stations cannot be the same");
        }

        return reservationRepository.bookTicket(request);
    }

    public ReservationDetailsResponse getReservationByPnr(String pnr) {
        return reservationRepository.findByPnr(pnr)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "PNR", pnr));
    }

    public List<ReservationDetailsResponse> getReservationsByPassengerId(Long passengerId) {
        passengerRepository.findById(passengerId)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger", "id", passengerId));
        return reservationRepository.findByPassengerId(passengerId);
    }

    public CancellationResponse cancelReservation(String pnr) {
        // Check reservation exists
        getReservationByPnr(pnr);
        return reservationRepository.cancelReservation(pnr);
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public long getReservationCount() {
        return reservationRepository.count();
    }
}
