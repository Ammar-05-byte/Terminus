package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.ExpirePendingRequest;
import com.railway.reservation.dto.QueryExecutionRequest;
import com.railway.reservation.dto.QueryResultResponse;
import com.railway.reservation.service.AdminService;
import com.railway.reservation.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST Controller for Database Operations Lab, Stored Procedure triggers, and Administrative maintenance.
 */
@RestController
@RequestMapping("/api/admin/database")
public class AdminController {

    private final ReportService reportService;
    private final AdminService adminService;

    public AdminController(ReportService reportService, AdminService adminService) {
        this.reportService = reportService;
        this.adminService = adminService;
    }

    /**
     * Executes PL/SQL stored procedure P_EXPIRE_STALE_RESERVATIONS.
     */
    @PostMapping("/expire-pending-reservations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> expirePendingReservations(
            @RequestBody(required = false) ExpirePendingRequest request) {
        int maxAge = (request != null && request.getMaxAgeMinutes() != null) ? request.getMaxAgeMinutes() : 15;
        int count = reportService.expirePendingReservations(maxAge);
        return ResponseEntity.ok(ApiResponse.success(
                "Expired " + count + " stale pending reservation(s)",
                Map.of("expiredCount", count, "maxAgeMinutes", maxAge)));
    }

    /**
     * Executes PL/SQL function F_AVAILABLE_SEAT_COUNT via CallableStatement.
     */
    @GetMapping("/available-seats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAvailableSeats(
            @RequestParam Long scheduleId,
            @RequestParam(required = false, defaultValue = "SL") String coachClass) {
        int availableCount = reportService.getAvailableSeatCount(scheduleId, coachClass);
        return ResponseEntity.ok(ApiResponse.success("Available seats counted via F_AVAILABLE_SEAT_COUNT",
                Map.of("scheduleId", scheduleId, "coachClass", coachClass, "availableSeats", availableCount)));
    }

    /**
     * Lists all available academic lab queries (Q01 - Q15).
     */
    @GetMapping("/queries")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAvailableQueries() {
        Map<String, String> queries = adminService.getAvailableQueries();
        return ResponseEntity.ok(ApiResponse.success("Available Lab Queries", queries));
    }

    /**
     * Executes a designated academic query by ID.
     */
    @PostMapping("/queries/execute")
    public ResponseEntity<ApiResponse<QueryResultResponse>> executeQuery(
            @Valid @RequestBody QueryExecutionRequest request) {
        QueryResultResponse result = adminService.executeQuery(request.getQueryId());
        return ResponseEntity.ok(ApiResponse.success("Query " + request.getQueryId() + " executed successfully", result));
    }
}
