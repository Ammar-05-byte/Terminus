package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.TrainRequest;
import com.railway.reservation.dto.TrainSearchResponse;
import com.railway.reservation.dto.TrainStopRequest;
import com.railway.reservation.model.Train;
import com.railway.reservation.model.TrainStop;
import com.railway.reservation.service.TrainService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller for Train searches, routes, and fleet management.
 */
@RestController
@RequestMapping("/api/trains")
public class TrainController {

    private final TrainService trainService;

    public TrainController(TrainService trainService) {
        this.trainService = trainService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Train>>> getAllTrains() {
        List<Train> trains = trainService.getAllTrains();
        return ResponseEntity.ok(ApiResponse.success("Retrieved all trains", trains));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TrainSearchResponse>>> searchTrains(
            @RequestParam Long sourceStationId,
            @RequestParam Long destStationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate journeyDate) {
        List<TrainSearchResponse> results = trainService.searchTrains(sourceStationId, destStationId, journeyDate);
        return ResponseEntity.ok(ApiResponse.success("Found " + results.size() + " trains", results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Train>> getTrainById(@PathVariable Long id) {
        Train train = trainService.getTrainById(id);
        return ResponseEntity.ok(ApiResponse.success(train));
    }

    @GetMapping("/{id}/route")
    public ResponseEntity<ApiResponse<List<TrainStop>>> getTrainRoute(@PathVariable Long id) {
        List<TrainStop> stops = trainService.getTrainRoute(id);
        return ResponseEntity.ok(ApiResponse.success("Retrieved train route", stops));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Train>> createTrain(@Valid @RequestBody TrainRequest request) {
        Train created = trainService.createTrain(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Train registered successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Train>> updateTrain(
            @PathVariable Long id,
            @Valid @RequestBody TrainRequest request) {
        Train updated = trainService.updateTrain(id, request);
        return ResponseEntity.ok(ApiResponse.success("Train updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrain(@PathVariable Long id) {
        trainService.deleteTrain(id);
        return ResponseEntity.ok(ApiResponse.success("Train deleted successfully", null));
    }

    @PostMapping("/{id}/stops")
    public ResponseEntity<ApiResponse<TrainStop>> addTrainStop(
            @PathVariable Long id,
            @Valid @RequestBody TrainStopRequest request) {
        TrainStop stop = trainService.addTrainStop(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stop added to train route", stop));
    }
}
