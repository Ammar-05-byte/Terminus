package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.PassengerRequest;
import com.railway.reservation.dto.ReservationDetailsResponse;
import com.railway.reservation.model.Passenger;
import com.railway.reservation.service.PassengerService;
import com.railway.reservation.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Passenger operations.
 */
@RestController
@RequestMapping("/api/passengers")
public class PassengerController {

    private final PassengerService passengerService;
    private final ReservationService reservationService;

    public PassengerController(PassengerService passengerService, ReservationService reservationService) {
        this.passengerService = passengerService;
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Passenger>>> getAllPassengers() {
        List<Passenger> passengers = passengerService.getAllPassengers();
        return ResponseEntity.ok(ApiResponse.success("Retrieved all passengers", passengers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Passenger>> getPassengerById(@PathVariable Long id) {
        Passenger passenger = passengerService.getPassengerById(id);
        return ResponseEntity.ok(ApiResponse.success(passenger));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Passenger>> createPassenger(@Valid @RequestBody PassengerRequest request) {
        Passenger created = passengerService.createPassenger(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Passenger registered successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Passenger>> updatePassenger(
            @PathVariable Long id,
            @Valid @RequestBody PassengerRequest request) {
        Passenger updated = passengerService.updatePassenger(id, request);
        return ResponseEntity.ok(ApiResponse.success("Passenger updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePassenger(@PathVariable Long id) {
        passengerService.deletePassenger(id);
        return ResponseEntity.ok(ApiResponse.success("Passenger deleted successfully", null));
    }

    @GetMapping("/{id}/reservations")
    public ResponseEntity<ApiResponse<List<ReservationDetailsResponse>>> getPassengerReservations(@PathVariable Long id) {
        List<ReservationDetailsResponse> reservations = reservationService.getReservationsByPassengerId(id);
        return ResponseEntity.ok(ApiResponse.success("Retrieved passenger reservations", reservations));
    }
}
