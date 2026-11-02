package com.railway.reservation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request payload for creating or updating a passenger record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PassengerRequest {

    @NotBlank(message = "Passenger full name is required")
    private String fullName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Gender is required (M, F, O)")
    @Pattern(regexp = "^[MFO]$", message = "Gender must be 'M', 'F', or 'O'")
    private String gender;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be a valid 10-digit number")
    private String phone;

    @NotBlank(message = "Email address is required")
    @Email(message = "Email address must be well-formed")
    private String email;
}
