package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Report DTO matching Query Q08: Coach Occupancy Analysis.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OccupancyReport {
    private Long trainId;
    private String trainNumber;
    private String trainName;
    private LocalDate journeyDate;
    private String coachClass;
    private int totalSeats;
    private int bookedSeats;
    private int availableSeats;
    private double occupancyPercentage;
}
