package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.QueryExecutionRequest;
import com.railway.reservation.dto.QueryResultResponse;
import com.railway.reservation.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller specifically mapped to /api/database-lab for interactive lab queries.
 */
@RestController
@RequestMapping("/api/database-lab")
public class DatabaseLabController {

    private final AdminService adminService;

    public DatabaseLabController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/queries")
    public ResponseEntity<ApiResponse<Map<String, String>>> listQueries() {
        return ResponseEntity.ok(ApiResponse.success("Available Lab Queries", adminService.getAvailableQueries()));
    }

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<QueryResultResponse>> runQuery(@Valid @RequestBody QueryExecutionRequest request) {
        QueryResultResponse result = adminService.executeQuery(request.getQueryId());
        return ResponseEntity.ok(ApiResponse.success("Query executed successfully", result));
    }
}
