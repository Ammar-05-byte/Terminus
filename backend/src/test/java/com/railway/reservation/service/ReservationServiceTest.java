package com.railway.reservation.service;

import com.railway.reservation.dto.BookingRequest;
import com.railway.reservation.dto.BookingResponse;
import com.railway.reservation.dto.CancellationResponse;
import com.railway.reservation.dto.ReservationDetailsResponse;
import com.railway.reservation.exception.BusinessException;
import com.railway.reservation.model.Passenger;
import com.railway.reservation.model.Seat;
import com.railway.reservation.model.Station;
import com.railway.reservation.model.TrainSchedule;
import com.railway.reservation.repository.PassengerRepository;
import com.railway.reservation.repository.ReservationRepository;
import com.railway.reservation.repository.ScheduleRepository;
import com.railway.reservation.repository.SeatRepository;
import com.railway.reservation.repository.StationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private PassengerRepository passengerRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private SeatRepository seatRepository;
    @Mock
    private StationRepository stationRepository;

    @InjectMocks
    private ReservationService reservationService;

    private BookingRequest bookingRequest;
    private BookingResponse bookingResponse;

    @BeforeEach
    void setUp() {
        bookingRequest = BookingRequest.builder()
                .passengerId(1L)
                .scheduleId(10L)
                .seatId(100L)
                .sourceStationId(5L)
                .destinationStationId(8L)
                .paymentMethod("UPI")
                .simulatedPaymentStatus("SUCCESS")
                .build();

        bookingResponse = BookingResponse.builder()
                .reservationId(501L)
                .pnr("PNR1234567")
                .fareAmount(new BigDecimal("1250.00"))
                .bookingStatus("CONFIRMED")
                .paymentStatus("SUCCESS")
                .message("Booking processed successfully")
                .build();
    }

    @Test
    @DisplayName("Should successfully book a ticket when all entities exist")
    void testBookTicket_Success() {
        when(passengerRepository.findById(1L)).thenReturn(Optional.of(new Passenger()));
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(new TrainSchedule()));
        when(seatRepository.findById(100L)).thenReturn(Optional.of(new Seat()));
        when(stationRepository.findById(5L)).thenReturn(Optional.of(new Station()));
        when(stationRepository.findById(8L)).thenReturn(Optional.of(new Station()));
        when(reservationRepository.bookTicket(bookingRequest)).thenReturn(bookingResponse);

        BookingResponse response = reservationService.bookTicket(bookingRequest);

        assertNotNull(response);
        assertEquals("PNR1234567", response.getPnr());
        assertEquals("CONFIRMED", response.getBookingStatus());
        verify(reservationRepository).bookTicket(bookingRequest);
    }

    @Test
    @DisplayName("Should throw BusinessException when source and destination are identical")
    void testBookTicket_SameSourceAndDest() {
        bookingRequest.setDestinationStationId(5L); // Same as source

        when(passengerRepository.findById(1L)).thenReturn(Optional.of(new Passenger()));
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(new TrainSchedule()));
        when(seatRepository.findById(100L)).thenReturn(Optional.of(new Seat()));
        when(stationRepository.findById(5L)).thenReturn(Optional.of(new Station()));

        assertThrows(BusinessException.class, () -> reservationService.bookTicket(bookingRequest));
    }

    @Test
    @DisplayName("Should cancel reservation successfully")
    void testCancelReservation_Success() {
        String pnr = "PNR1234567";
        CancellationResponse expectedResponse = CancellationResponse.builder()
                .result("RESERVATION_CANCELLED_REFUND_ISSUED")
                .bookingStatus("CANCELLED")
                .refundAmount(new BigDecimal("1250.00"))
                .transactionReference("TXN-REFUND-999")
                .build();

        when(reservationRepository.findByPnr(pnr)).thenReturn(Optional.of(new ReservationDetailsResponse()));
        when(reservationRepository.cancelReservation(pnr)).thenReturn(expectedResponse);

        CancellationResponse response = reservationService.cancelReservation(pnr);

        assertNotNull(response);
        assertEquals("CANCELLED", response.getBookingStatus());
        assertEquals(new BigDecimal("1250.00"), response.getRefundAmount());
        verify(reservationRepository).cancelReservation(pnr);
    }
}
