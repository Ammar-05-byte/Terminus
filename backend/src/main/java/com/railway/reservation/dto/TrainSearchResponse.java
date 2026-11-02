package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Train search result matching Query Q01: Trains between two stations on a given date.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainSearchResponse {
    private Long trainId;
    private String trainNumber;
    private String trainName;
    private String trainType;
    private Long scheduleId;
    private LocalDate journeyDate;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private String sourceDepartureTime;
    private String destArrivalTime;
    private Long sourceStationId;
    private String sourceStationCode;
    private String sourceStationName;
    private Long destinationStationId;
    private String destinationStationCode;
    private String destinationStationName;
    private int availableSeats;
}
