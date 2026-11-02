package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Report DTO matching Query Q09: Financial Revenue Summary per Train.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueReport {
    private Long trainId;
    private String trainNumber;
    private String trainName;
    private long totalBookings;
    private BigDecimal grossRevenue;
    private BigDecimal totalRefunds;
    private BigDecimal netRevenue;
}
