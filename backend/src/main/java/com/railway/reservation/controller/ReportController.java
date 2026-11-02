package com.railway.reservation.controller;

import com.railway.reservation.dto.ApiResponse;
import com.railway.reservation.dto.DashboardResponse;
import com.railway.reservation.dto.MonthlyBookingReport;
import com.railway.reservation.dto.OccupancyReport;
import com.railway.reservation.dto.PopularRouteReport;
import com.railway.reservation.dto.RevenueReport;
import com.railway.reservation.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Analytical and Financial Reports.
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboardStats() {
        DashboardResponse stats = reportService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics loaded", stats));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<List<RevenueReport>>> getRevenueReport() {
        List<RevenueReport> report = reportService.getRevenueReport();
        return ResponseEntity.ok(ApiResponse.success("Revenue report generated (Q09)", report));
    }

    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<List<OccupancyReport>>> getOccupancyReport() {
        List<OccupancyReport> report = reportService.getOccupancyReport();
        return ResponseEntity.ok(ApiResponse.success("Occupancy report generated (Q08)", report));
    }

    @GetMapping("/monthly-bookings")
    public ResponseEntity<ApiResponse<List<MonthlyBookingReport>>> getMonthlyBookings() {
        List<MonthlyBookingReport> report = reportService.getMonthlyBookings();
        return ResponseEntity.ok(ApiResponse.success("Monthly bookings generated (Q14)", report));
    }

    @GetMapping("/popular-routes")
    public ResponseEntity<ApiResponse<List<PopularRouteReport>>> getPopularRoutes() {
        List<PopularRouteReport> report = reportService.getPopularRoutes();
        return ResponseEntity.ok(ApiResponse.success("Popular routes generated (Q10)", report));
    }
}
