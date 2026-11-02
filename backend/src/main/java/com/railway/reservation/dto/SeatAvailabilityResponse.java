package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Seat details along with real-time reservation availability status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatAvailabilityResponse {
    private Long seatId;
    private String coachNumber;
    private Integer seatNumber;
    private String coachClass;
    private String berthType;
    private boolean available;
}
