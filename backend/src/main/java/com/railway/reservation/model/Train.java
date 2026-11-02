package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model matching table TRAIN.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Train {
    private Long trainId;
    private String trainNumber;
    private String trainName;
    private String trainType;
    private String activeStatus;
}
