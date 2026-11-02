package com.railway.reservation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for creating or updating a train seat.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatRequest {

    @NotNull(message = "Train ID is required")
    private Long trainId;

    @NotBlank(message = "Coach number is required (e.g. S1, B1, A1)")
    private String coachNumber;

    @NotNull(message = "Seat number is required")
    @Min(value = 1, message = "Seat number must be greater than 0")
    private Integer seatNumber;

    @NotBlank(message = "Coach class is required (e.g. 1A, 2A, 3A, SL, CC)")
    private String coachClass;

    @NotBlank(message = "Berth type is required (e.g. LOWER, UPPER, MIDDLE, SIDE LOWER, SIDE UPPER, WINDOW)")
    private String berthType;
}
