package com.railway.reservation.service;

import com.railway.reservation.dto.SeatAvailabilityResponse;
import com.railway.reservation.dto.SeatRequest;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Seat;
import com.railway.reservation.repository.ScheduleRepository;
import com.railway.reservation.repository.SeatRepository;
import com.railway.reservation.repository.TrainRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service managing Seats and inventory availability.
 */
@Service
public class SeatService {

    private final SeatRepository seatRepository;
    private final TrainRepository trainRepository;
    private final ScheduleRepository scheduleRepository;

    public SeatService(SeatRepository seatRepository,
                       TrainRepository trainRepository,
                       ScheduleRepository scheduleRepository) {
        this.seatRepository = seatRepository;
        this.trainRepository = trainRepository;
        this.scheduleRepository = scheduleRepository;
    }

    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    public Seat getSeatById(Long id) {
        return seatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seat", "id", id));
    }

    public List<Seat> getSeatsByTrain(Long trainId) {
        trainRepository.findById(trainId)
                .orElseThrow(() -> new ResourceNotFoundException("Train", "id", trainId));
        return seatRepository.findByTrain(trainId);
    }

    public List<Seat> getAvailableSeats(Long scheduleId, String coachClass) {
        scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("TrainSchedule", "id", scheduleId));
        return seatRepository.findAvailableSeats(scheduleId, coachClass);
    }

    public List<SeatAvailabilityResponse> getSeatAvailabilityForSchedule(Long scheduleId) {
        scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("TrainSchedule", "id", scheduleId));
        return seatRepository.findByScheduleWithAvailability(scheduleId);
    }

    public Seat createSeat(SeatRequest request) {
        trainRepository.findById(request.getTrainId())
                .orElseThrow(() -> new ResourceNotFoundException("Train", "id", request.getTrainId()));

        Seat seat = Seat.builder()
                .trainId(request.getTrainId())
                .coachNumber(request.getCoachNumber())
                .seatNumber(request.getSeatNumber())
                .coachClass(request.getCoachClass())
                .berthType(request.getBerthType())
                .build();

        return seatRepository.save(seat);
    }

    public Seat updateSeat(Long id, SeatRequest request) {
        Seat existing = getSeatById(id);
        trainRepository.findById(request.getTrainId())
                .orElseThrow(() -> new ResourceNotFoundException("Train", "id", request.getTrainId()));

        existing.setTrainId(request.getTrainId());
        existing.setCoachNumber(request.getCoachNumber());
        existing.setSeatNumber(request.getSeatNumber());
        existing.setCoachClass(request.getCoachClass());
        existing.setBerthType(request.getBerthType());

        seatRepository.update(existing);
        return existing;
    }

    public void deleteSeat(Long id) {
        getSeatById(id);
        seatRepository.delete(id);
    }

    public long getSeatCount() {
        return seatRepository.count();
    }
}
