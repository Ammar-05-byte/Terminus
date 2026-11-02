package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.StationRequest;
import com.railway.reservation.model.Station;
import com.railway.reservation.service.StationService;
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
 * REST Controller for Railway Station operations.
 */
@RestController
@RequestMapping("/api/stations")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Station>>> getAllStations() {
        List<Station> stations = stationService.getAllStations();
        return ResponseEntity.ok(ApiResponse.success("Retrieved all stations", stations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Station>> getStationById(@PathVariable Long id) {
        Station station = stationService.getStationById(id);
        return ResponseEntity.ok(ApiResponse.success(station));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<Station>> getStationByCode(@PathVariable String code) {
        Station station = stationService.getStationByCode(code);
        return ResponseEntity.ok(ApiResponse.success(station));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Station>> createStation(@Valid @RequestBody StationRequest request) {
        Station created = stationService.createStation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Station created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Station>> updateStation(
            @PathVariable Long id,
            @Valid @RequestBody StationRequest request) {
        Station updated = stationService.updateStation(id, request);
        return ResponseEntity.ok(ApiResponse.success("Station updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStation(@PathVariable Long id) {
        stationService.deleteStation(id);
        return ResponseEntity.ok(ApiResponse.success("Station deleted successfully", null));
    }
}
