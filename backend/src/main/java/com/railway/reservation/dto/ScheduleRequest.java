package com.railway.reservation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Request payload for creating or updating a train schedule.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleRequest {

    @NotNull(message = "Train ID is required")
    private Long trainId;

    @NotNull(message = "Journey date is required")
    private LocalDate journeyDate;

    @NotNull(message = "Scheduled departure timestamp is required")
    private LocalDateTime scheduledDeparture;

    @NotNull(message = "Scheduled arrival timestamp is required")
    private LocalDateTime scheduledArrival;

    @Builder.Default
    private String scheduleStatus = "SCHEDULED";
}
