package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model matching table SEAT.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {
    private Long seatId;
    private Long trainId;
    private String coachNumber;
    private Integer seatNumber;
    private String coachClass;
    private String berthType;
}
