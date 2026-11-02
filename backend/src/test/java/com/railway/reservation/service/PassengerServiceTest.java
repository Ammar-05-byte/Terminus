package com.railway.reservation.service;

import com.railway.reservation.dto.PassengerRequest;
import com.railway.reservation.exception.DuplicateResourceException;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Passenger;
import com.railway.reservation.repository.PassengerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PassengerServiceTest {

    @Mock
    private PassengerRepository passengerRepository;

    @InjectMocks
    private PassengerService passengerService;

    private Passenger samplePassenger;
    private PassengerRequest sampleRequest;

    @BeforeEach
    void setUp() {
        samplePassenger = Passenger.builder()
                .passengerId(1L)
                .fullName("Rahul Sharma")
                .dateOfBirth(LocalDate.of(1995, 5, 20))
                .gender("M")
                .phone("9876543210")
                .email("rahul.sharma@example.com")
                .build();

        sampleRequest = PassengerRequest.builder()
                .fullName("Rahul Sharma")
                .dateOfBirth(LocalDate.of(1995, 5, 20))
                .gender("M")
                .phone("9876543210")
                .email("rahul.sharma@example.com")
                .build();
    }

    @Test
    @DisplayName("Should successfully retrieve all passengers")
    void testGetAllPassengers() {
        when(passengerRepository.findAll()).thenReturn(List.of(samplePassenger));

        List<Passenger> result = passengerService.getAllPassengers();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Rahul Sharma", result.get(0).getFullName());
        verify(passengerRepository).findAll();
    }

    @Test
    @DisplayName("Should retrieve passenger by ID")
    void testGetPassengerById_Success() {
        when(passengerRepository.findById(1L)).thenReturn(Optional.of(samplePassenger));

        Passenger result = passengerService.getPassengerById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getPassengerId());
        assertEquals("Rahul Sharma", result.getFullName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when passenger does not exist")
    void testGetPassengerById_NotFound() {
        when(passengerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> passengerService.getPassengerById(99L));
    }

    @Test
    @DisplayName("Should create a new passenger when phone and email are unique")
    void testCreatePassenger_Success() {
        when(passengerRepository.findByPhone(sampleRequest.getPhone())).thenReturn(Optional.empty());
        when(passengerRepository.findByEmail(sampleRequest.getEmail())).thenReturn(Optional.empty());
        when(passengerRepository.save(any(Passenger.class))).thenReturn(samplePassenger);

        Passenger result = passengerService.createPassenger(sampleRequest);

        assertNotNull(result);
        assertEquals(1L, result.getPassengerId());
        verify(passengerRepository).save(any(Passenger.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when phone is already registered")
    void testCreatePassenger_DuplicatePhone() {
        when(passengerRepository.findByPhone(sampleRequest.getPhone())).thenReturn(Optional.of(samplePassenger));

        assertThrows(DuplicateResourceException.class, () -> passengerService.createPassenger(sampleRequest));
    }
}
