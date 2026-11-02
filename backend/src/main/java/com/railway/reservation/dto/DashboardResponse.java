package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * High-level system statistics for Admin Dashboard.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private long totalPassengers;
    private long totalTrains;
    private long totalStations;
    private long totalReservations;
    private long confirmedCount;
    private long pendingCount;
    private long cancelledCount;
    private BigDecimal totalRevenue;
    private BigDecimal totalRefunds;
}
