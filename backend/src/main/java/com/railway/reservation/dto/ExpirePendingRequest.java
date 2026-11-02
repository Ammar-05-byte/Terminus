package com.railway.reservation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for expiring stale pending reservations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpirePendingRequest {

    @NotNull(message = "Max age in minutes is required")
    @Min(value = 1, message = "Max age must be at least 1 minute")
    @Builder.Default
    private Integer maxAgeMinutes = 15;
}
