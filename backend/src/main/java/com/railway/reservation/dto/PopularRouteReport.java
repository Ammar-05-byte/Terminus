package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Report DTO matching Query Q10: Top Popular Travel Routes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PopularRouteReport {
    private Long sourceStationId;
    private String sourceStationCode;
    private String sourceStationName;
    private Long destinationStationId;
    private String destinationStationCode;
    private String destinationStationName;
    private long totalTrips;
    private long totalPassengers;
    private BigDecimal totalRevenue;
}
