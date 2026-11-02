package com.railway.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for creating or updating a station.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StationRequest {

    @NotBlank(message = "Station code is required")
    @Size(min = 2, max = 5, message = "Station code must be 2 to 5 characters")
    private String stationCode;

    @NotBlank(message = "Station name is required")
    private String stationName;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;
}
