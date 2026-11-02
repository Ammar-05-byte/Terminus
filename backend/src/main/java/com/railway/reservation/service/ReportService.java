package com.railway.reservation.service;

import com.railway.reservation.dto.DashboardResponse;
import com.railway.reservation.dto.MonthlyBookingReport;
import com.railway.reservation.dto.OccupancyReport;
import com.railway.reservation.dto.PopularRouteReport;
import com.railway.reservation.dto.RevenueReport;
import com.railway.reservation.repository.ReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service managing Reporting, Dashboard analytics, and stored procedures/functions.
 */
@Service
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public DashboardResponse getDashboardStats() {
        return reportRepository.getDashboardStats();
    }

    public List<RevenueReport> getRevenueReport() {
        return reportRepository.getRevenueReport();
    }

    public List<OccupancyReport> getOccupancyReport() {
        return reportRepository.getOccupancyReport();
    }

    public List<MonthlyBookingReport> getMonthlyBookings() {
        return reportRepository.getMonthlyBookings();
    }

    public List<PopularRouteReport> getPopularRoutes() {
        return reportRepository.getPopularRoutes();
    }

    public int getAvailableSeatCount(Long scheduleId, String coachClass) {
        return reportRepository.getAvailableSeatCount(scheduleId, coachClass);
    }

    public int expirePendingReservations(int maxAgeMinutes) {
        return reportRepository.expirePendingReservations(maxAgeMinutes);
    }
}
