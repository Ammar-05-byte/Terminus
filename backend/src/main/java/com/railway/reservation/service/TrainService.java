package com.railway.reservation.service;

import com.railway.reservation.dto.TrainRequest;
import com.railway.reservation.dto.TrainSearchResponse;
import com.railway.reservation.dto.TrainStopRequest;
import com.railway.reservation.exception.BusinessException;
import com.railway.reservation.exception.DuplicateResourceException;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Train;
import com.railway.reservation.model.TrainSchedule;
import com.railway.reservation.model.TrainStop;
import com.railway.reservation.repository.ScheduleRepository;
import com.railway.reservation.repository.StationRepository;
import com.railway.reservation.repository.TrainRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Service managing Train entities, searches, and route configuration.
 */
@Service
public class TrainService {

    private final TrainRepository trainRepository;
    private final StationRepository stationRepository;
    private final ScheduleRepository scheduleRepository;

    public TrainService(TrainRepository trainRepository, StationRepository stationRepository, ScheduleRepository scheduleRepository) {
        this.trainRepository = trainRepository;
        this.stationRepository = stationRepository;
        this.scheduleRepository = scheduleRepository;
    }

    public List<Train> getAllTrains() {
        return trainRepository.findAll();
    }

    public Train getTrainById(Long id) {
        return trainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Train", "id", id));
    }

    public Train getTrainByNumber(String trainNumber) {
        return trainRepository.findByNumber(trainNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Train", "number", trainNumber));
    }

    public List<TrainSearchResponse> searchTrains(Long sourceStationId, Long destStationId, LocalDate journeyDate) {
        if (sourceStationId.equals(destStationId)) {
            throw new BusinessException("Source and destination stations cannot be identical");
        }
        stationRepository.findById(sourceStationId)
                .orElseThrow(() -> new ResourceNotFoundException("Source Station", "id", sourceStationId));
        stationRepository.findById(destStationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination Station", "id", destStationId));

        if (journeyDate == null) {
            throw new BusinessException("Journey date must be specified");
        }

        ensureSchedulesExist(journeyDate);

        return trainRepository.searchTrains(sourceStationId, destStationId, journeyDate);
    }

    private void ensureSchedulesExist(LocalDate journeyDate) {
        if (journeyDate == null) return;
        try {
            if (scheduleRepository.countByDate(journeyDate) == 0) {
                List<Train> activeTrains = trainRepository.findAll().stream()
                        .filter(t -> "ACTIVE".equalsIgnoreCase(t.getActiveStatus()))
                        .toList();
                for (Train train : activeTrains) {
                    TrainSchedule sched = TrainSchedule.builder()
                            .trainId(train.getTrainId())
                            .journeyDate(journeyDate)
                            .scheduledDeparture(journeyDate.atTime(8, 0))
                            .scheduledArrival(journeyDate.atTime(20, 0))
                            .scheduleStatus("SCHEDULED")
                            .build();
                    try {
                        scheduleRepository.save(sched);
                    } catch (Exception ignored) {
                        // Ignore unique constraint violation if concurrently inserted
                    }
                }
            }
        } catch (Exception e) {
            // Log and allow search to proceed
        }
    }

    public List<TrainStop> getTrainRoute(Long trainId) {
        getTrainById(trainId);
        return trainRepository.findTrainRoute(trainId);
    }

    public Train createTrain(TrainRequest request) {
        trainRepository.findByNumber(request.getTrainNumber()).ifPresent(t -> {
            throw new DuplicateResourceException("Train", "number", request.getTrainNumber());
        });

        Train train = Train.builder()
                .trainNumber(request.getTrainNumber())
                .trainName(request.getTrainName())
                .trainType(normalizeTrainType(request.getTrainType()))
                .activeStatus(request.getActiveStatus() != null ? request.getActiveStatus().toUpperCase() : "ACTIVE")
                .build();

        return trainRepository.save(train);
    }

    public Train updateTrain(Long id, TrainRequest request) {
        Train existing = getTrainById(id);

        existing.setTrainNumber(request.getTrainNumber());
        existing.setTrainName(request.getTrainName());
        existing.setTrainType(normalizeTrainType(request.getTrainType()));
        existing.setActiveStatus(request.getActiveStatus() != null ? request.getActiveStatus().toUpperCase() : "ACTIVE");

        trainRepository.update(existing);
        return existing;
    }

    private String normalizeTrainType(String type) {
        if (type == null) return "Express";
        String lower = type.trim().toLowerCase();
        return switch (lower) {
            case "superfast" -> "Superfast";
            case "rajdhani" -> "Rajdhani";
            case "shatabdi" -> "Shatabdi";
            case "duronto" -> "Duronto";
            case "local" -> "Local";
            case "mail" -> "Mail";
            case "vande_bharat", "vande bharat" -> "Superfast";
            default -> "Express";
        };
    }

    public void deleteTrain(Long id) {
        getTrainById(id);
        trainRepository.delete(id);
    }

    public TrainStop addTrainStop(Long trainId, TrainStopRequest request) {
        getTrainById(trainId);
        stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new ResourceNotFoundException("Station", "id", request.getStationId()));

        TrainStop stop = TrainStop.builder()
                .trainId(trainId)
                .stopSequence(request.getStopSequence())
                .stationId(request.getStationId())
                .arrivalTime(request.getArrivalTime())
                .departureTime(request.getDepartureTime())
                .distanceFromOriginKm(request.getDistanceFromOriginKm())
                .build();

        trainRepository.addTrainStop(stop);
        return stop;
    }

    public long getTrainCount() {
        return trainRepository.count();
    }
}
