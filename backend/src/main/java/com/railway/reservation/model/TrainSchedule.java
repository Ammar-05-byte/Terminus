package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Domain model matching table TRAIN_SCHEDULE.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainSchedule {
    private Long scheduleId;
    private Long trainId;
    private String trainNumber;
    private String trainName;
    private LocalDate journeyDate;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private String scheduleStatus;
}
