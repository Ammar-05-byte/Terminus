package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model matching table STATION.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Station {
    private Long stationId;
    private String stationCode;
    private String stationName;
    private String city;
    private String state;
}
