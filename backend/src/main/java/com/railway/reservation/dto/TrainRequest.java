package com.railway.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for creating or updating a train.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainRequest {

    @NotBlank(message = "Train number is required")
    @Pattern(regexp = "^[0-9]{5}$", message = "Train number must be 5 digits")
    private String trainNumber;

    @NotBlank(message = "Train name is required")
    private String trainName;

    @NotBlank(message = "Train type is required (e.g. EXPRESS, SUPERFAST, RAJDHANI, SHATABDI)")
    private String trainType;

    @Builder.Default
    private String activeStatus = "ACTIVE";
}
