package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Domain model matching table TRAIN_STOP (joined with STATION).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainStop {
    private Long trainId;
    private Integer stopSequence;
    private Long stationId;
    private String stationName;
    private String stationCode;
    private String arrivalTime;
    private String departureTime;
    private BigDecimal distanceFromOriginKm;
}
