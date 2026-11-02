package com.railway.reservation.service;

import com.railway.reservation.dto.PassengerRequest;
import com.railway.reservation.exception.DuplicateResourceException;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Passenger;
import com.railway.reservation.repository.PassengerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service managing Passenger business logic.
 */
@Service
public class PassengerService {

    private final PassengerRepository passengerRepository;

    public PassengerService(PassengerRepository passengerRepository) {
        this.passengerRepository = passengerRepository;
    }

    public List<Passenger> getAllPassengers() {
        return passengerRepository.findAll();
    }

    public Passenger getPassengerById(Long id) {
        return passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger", "id", id));
    }

    public Passenger createPassenger(PassengerRequest request) {
        passengerRepository.findByPhone(request.getPhone()).ifPresent(p -> {
            throw new DuplicateResourceException("Passenger", "phone", request.getPhone());
        });

        passengerRepository.findByEmail(request.getEmail()).ifPresent(p -> {
            throw new DuplicateResourceException("Passenger", "email", request.getEmail());
        });

        Passenger passenger = Passenger.builder()
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(normalizeGender(request.getGender()))
                .phone(request.getPhone())
                .email(request.getEmail().toLowerCase())
                .build();

        return passengerRepository.save(passenger);
    }

    public Passenger updatePassenger(Long id, PassengerRequest request) {
        Passenger existing = getPassengerById(id);

        passengerRepository.findByPhone(request.getPhone()).ifPresent(p -> {
            if (!p.getPassengerId().equals(id)) {
                throw new DuplicateResourceException("Passenger", "phone", request.getPhone());
            }
        });

        passengerRepository.findByEmail(request.getEmail()).ifPresent(p -> {
            if (!p.getPassengerId().equals(id)) {
                throw new DuplicateResourceException("Passenger", "email", request.getEmail());
            }
        });

        existing.setFullName(request.getFullName());
        existing.setDateOfBirth(request.getDateOfBirth());
        existing.setGender(normalizeGender(request.getGender()));
        existing.setPhone(request.getPhone());
        existing.setEmail(request.getEmail().toLowerCase());

        passengerRepository.update(existing);
        return existing;
    }

    private String normalizeGender(String g) {
        if (g == null) return "Other";
        String upper = g.trim().toUpperCase();
        if (upper.equals("M") || upper.equals("MALE")) return "Male";
        if (upper.equals("F") || upper.equals("FEMALE")) return "Female";
        return "Other";
    }

    public void deletePassenger(Long id) {
        getPassengerById(id);
        passengerRepository.delete(id);
    }

    public long getPassengerCount() {
        return passengerRepository.count();
    }
}
