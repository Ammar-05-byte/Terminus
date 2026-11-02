package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Report DTO matching Query Q14: Monthly Booking Trends and Aggregate Stats.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyBookingReport {
    private String bookingMonth;
    private int year;
    private long totalBookings;
    private long confirmedBookings;
    private long cancelledBookings;
    private BigDecimal totalRevenue;
}
