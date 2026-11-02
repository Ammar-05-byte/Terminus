package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.SeatRequest;
import com.railway.reservation.model.Seat;
import com.railway.reservation.service.SeatService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Seat inventory and availability.
 */
@RestController
@RequestMapping("/api/seats")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Seat>>> getAllSeats() {
        List<Seat> seats = seatService.getAllSeats();
        return ResponseEntity.ok(ApiResponse.success("Retrieved seats", seats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Seat>> getSeatById(@PathVariable Long id) {
        Seat seat = seatService.getSeatById(id);
        return ResponseEntity.ok(ApiResponse.success(seat));
    }

    @GetMapping("/train/{trainId}")
    public ResponseEntity<ApiResponse<List<Seat>>> getSeatsByTrain(@PathVariable Long trainId) {
        List<Seat> seats = seatService.getSeatsByTrain(trainId);
        return ResponseEntity.ok(ApiResponse.success("Retrieved seats for train " + trainId, seats));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Seat>>> getAvailableSeats(
            @RequestParam Long scheduleId,
            @RequestParam(required = false) String coachClass) {
        List<Seat> seats = seatService.getAvailableSeats(scheduleId, coachClass);
        return ResponseEntity.ok(ApiResponse.success("Retrieved available seats", seats));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Seat>> createSeat(@Valid @RequestBody SeatRequest request) {
        Seat created = seatService.createSeat(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Seat created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Seat>> updateSeat(
            @PathVariable Long id,
            @Valid @RequestBody SeatRequest request) {
        Seat updated = seatService.updateSeat(id, request);
        return ResponseEntity.ok(ApiResponse.success("Seat updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSeat(@PathVariable Long id) {
        seatService.deleteSeat(id);
        return ResponseEntity.ok(ApiResponse.success("Seat deleted successfully", null));
    }
}
