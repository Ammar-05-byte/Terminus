package com.railway.reservation.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Domain model matching table PASSENGER.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Passenger {
    private Long passengerId;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String email;
}
