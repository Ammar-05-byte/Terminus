package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.ScheduleRequest;
import com.railway.reservation.dto.SeatAvailabilityResponse;
import com.railway.reservation.model.TrainSchedule;
import com.railway.reservation.service.ScheduleService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Train Schedules and Schedule-level Seat Availability.
 */
@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final SeatService seatService;

    public ScheduleController(ScheduleService scheduleService, SeatService seatService) {
        this.scheduleService = scheduleService;
        this.seatService = seatService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TrainSchedule>>> getAllSchedules() {
        List<TrainSchedule> list = scheduleService.getAllSchedules();
        return ResponseEntity.ok(ApiResponse.success("Retrieved schedules", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TrainSchedule>> getScheduleById(@PathVariable Long id) {
        TrainSchedule schedule = scheduleService.getScheduleById(id);
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<ApiResponse<List<SeatAvailabilityResponse>>> getSeatsForSchedule(@PathVariable Long id) {
        List<SeatAvailabilityResponse> seats = seatService.getSeatAvailabilityForSchedule(id);
        return ResponseEntity.ok(ApiResponse.success("Retrieved seat availability for schedule " + id, seats));
    }

    @GetMapping("/station/{stationId}")
    public ResponseEntity<ApiResponse<List<TrainSchedule>>> getUpcomingFromStation(@PathVariable Long stationId) {
        List<TrainSchedule> schedules = scheduleService.getUpcomingFromStation(stationId);
        return ResponseEntity.ok(ApiResponse.success("Retrieved upcoming schedules for station " + stationId, schedules));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TrainSchedule>> createSchedule(@Valid @RequestBody ScheduleRequest request) {
        TrainSchedule created = scheduleService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Train schedule created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TrainSchedule>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleRequest request) {
        TrainSchedule updated = scheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(ApiResponse.success("Train schedule updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.success("Train schedule deleted successfully", null));
    }
}
