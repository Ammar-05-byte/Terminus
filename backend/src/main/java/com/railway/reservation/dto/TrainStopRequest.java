package com.railway.reservation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request payload for creating or updating a train stop.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainStopRequest {

    @NotNull(message = "Stop sequence number is required")
    @Min(value = 1, message = "Stop sequence must be 1 or greater")
    private Integer stopSequence;

    @NotNull(message = "Station ID is required")
    private Long stationId;

    @NotBlank(message = "Arrival time is required (HH:mm)")
    private String arrivalTime;

    @NotBlank(message = "Departure time is required (HH:mm)")
    private String departureTime;

    @NotNull(message = "Distance from origin in KM is required")
    @DecimalMin(value = "0.0", message = "Distance cannot be negative")
    private BigDecimal distanceFromOriginKm;
}
