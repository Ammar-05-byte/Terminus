package com.railway.reservation.service;

import com.railway.reservation.dto.TrainRequest;
import com.railway.reservation.dto.TrainSearchResponse;
import com.railway.reservation.dto.TrainStopRequest;
import com.railway.reservation.exception.BusinessException;
import com.railway.reservation.exception.DuplicateResourceException;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Seat;
import com.railway.reservation.model.Train;
import com.railway.reservation.model.TrainSchedule;
import com.railway.reservation.model.TrainStop;
import com.railway.reservation.repository.ScheduleRepository;
import com.railway.reservation.repository.SeatRepository;
import com.railway.reservation.repository.StationRepository;
import com.railway.reservation.repository.TrainRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Service managing Train entities, searches, route configuration, seat provisioning,
 * and automated schedule synchronization.
 */
@Service
public class TrainService {

    private static final Logger log = LoggerFactory.getLogger(TrainService.class);

    private final TrainRepository trainRepository;
    private final StationRepository stationRepository;
    private final ScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;

    public TrainService(TrainRepository trainRepository,
                        StationRepository stationRepository,
                        ScheduleRepository scheduleRepository,
                        SeatRepository seatRepository) {
        this.trainRepository = trainRepository;
        this.stationRepository = stationRepository;
        this.scheduleRepository = scheduleRepository;
        this.seatRepository = seatRepository;
    }

    @PostConstruct
    public void initActiveFleet() {
        try {
            List<Train> activeTrains = trainRepository.findAll().stream()
                    .filter(t -> "ACTIVE".equalsIgnoreCase(t.getActiveStatus()))
                    .toList();
            for (Train train : activeTrains) {
                ensureSeatsExist(train);
                autoGenerateSchedulesForTrain(train.getTrainId(), 14);
            }
        } catch (Exception e) {
            log.warn("Fleet active initialization warning: {}", e.getMessage());
        }
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
            List<Train> activeTrains = trainRepository.findAll().stream()
                    .filter(t -> "ACTIVE".equalsIgnoreCase(t.getActiveStatus()))
                    .toList();

            for (Train train : activeTrains) {
                // 1. Ensure rake seat layout exists
                ensureSeatsExist(train);

                // 2. Ensure schedule exists on this date
                List<TrainSchedule> existingSchedules = scheduleRepository.findByTrainAndDate(train.getTrainId(), journeyDate);
                if (existingSchedules.isEmpty()) {
                    List<TrainStop> route = trainRepository.findTrainRoute(train.getTrainId());
                    LocalTime depTime = LocalTime.of(8, 0);
                    LocalTime arrTime = LocalTime.of(20, 0);

                    if (route != null && !route.isEmpty()) {
                        TrainStop firstStop = route.get(0);
                        TrainStop lastStop = route.get(route.size() - 1);
                        if (firstStop.getDepartureTime() != null) {
                            depTime = parseTime(firstStop.getDepartureTime(), depTime);
                        } else if (firstStop.getArrivalTime() != null) {
                            depTime = parseTime(firstStop.getArrivalTime(), depTime);
                        }
                        if (lastStop.getArrivalTime() != null) {
                            arrTime = parseTime(lastStop.getArrivalTime(), arrTime);
                        } else if (lastStop.getDepartureTime() != null) {
                            arrTime = parseTime(lastStop.getDepartureTime(), arrTime);
                        }
                    }

                    LocalDateTime departure = journeyDate.atTime(depTime);
                    LocalDateTime arrival = (arrTime.isBefore(depTime) || arrTime.equals(depTime))
                            ? journeyDate.plusDays(1).atTime(arrTime)
                            : journeyDate.atTime(arrTime);

                    TrainSchedule sched = TrainSchedule.builder()
                            .trainId(train.getTrainId())
                            .journeyDate(journeyDate)
                            .scheduledDeparture(departure)
                            .scheduledArrival(arrival)
                            .scheduleStatus("SCHEDULED")
                            .build();

                    try {
                        scheduleRepository.save(sched);
                    } catch (Exception ignored) {
                        // Ignore concurrent insert or unique key conflict
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error ensuring schedules for date {}: {}", journeyDate, e.getMessage());
        }
    }

    public void autoGenerateSchedulesForTrain(Long trainId, int daysAhead) {
        try {
            Train train = getTrainById(trainId);
            if (!"ACTIVE".equalsIgnoreCase(train.getActiveStatus())) return;

            ensureSeatsExist(train);

            List<TrainStop> route = trainRepository.findTrainRoute(trainId);
            if (route == null || route.size() < 2) return;

            TrainStop first = route.get(0);
            TrainStop last = route.get(route.size() - 1);

            LocalTime depTime = parseTime(first.getDepartureTime() != null ? first.getDepartureTime() : first.getArrivalTime(), LocalTime.of(8, 0));
            LocalTime arrTime = parseTime(last.getArrivalTime() != null ? last.getArrivalTime() : last.getDepartureTime(), LocalTime.of(20, 0));

            LocalDate today = LocalDate.now();
            for (int i = 0; i <= daysAhead; i++) {
                LocalDate date = today.plusDays(i);
                List<TrainSchedule> existing = scheduleRepository.findByTrainAndDate(trainId, date);
                if (existing.isEmpty()) {
                    LocalDateTime departure = date.atTime(depTime);
                    LocalDateTime arrival = (arrTime.isBefore(depTime) || arrTime.equals(depTime))
                            ? date.plusDays(1).atTime(arrTime)
                            : date.atTime(arrTime);

                    TrainSchedule sched = TrainSchedule.builder()
                            .trainId(trainId)
                            .journeyDate(date)
                            .scheduledDeparture(departure)
                            .scheduledArrival(arrival)
                            .scheduleStatus("SCHEDULED")
                            .build();

                    try {
                        scheduleRepository.save(sched);
                    } catch (Exception ignored) {
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error auto-generating schedules for train {}: {}", trainId, e.getMessage());
        }
    }

    public void ensureSeatsExist(Train train) {
        if (train == null || train.getTrainId() == null) return;
        try {
            List<Seat> existing = seatRepository.findByTrain(train.getTrainId());
            if (!existing.isEmpty()) return;

            String name = train.getTrainName() != null ? train.getTrainName().toLowerCase() : "";
            String type = train.getTrainType() != null ? train.getTrainType().toLowerCase() : "";

            if (name.contains("vande bharat") || type.contains("shatabdi")) {
                // Executive Chair Car (EC): 6 seats
                for (int s = 1; s <= 6; s++) {
                    String berth = (s % 2 == 1) ? "WINDOW" : "AISLE";
                    saveSeatSafe(train.getTrainId(), "E1", s, "EC", berth);
                }
                // AC Chair Car (CC): Coach C1 (12 seats)
                for (int s = 1; s <= 12; s++) {
                    String berth = (s % 3 == 1) ? "WINDOW" : (s % 3 == 2) ? "MIDDLE" : "AISLE";
                    saveSeatSafe(train.getTrainId(), "C1", s, "CC", berth);
                }
                // AC Chair Car (CC): Coach C2 (12 seats)
                for (int s = 1; s <= 12; s++) {
                    String berth = (s % 3 == 1) ? "WINDOW" : (s % 3 == 2) ? "MIDDLE" : "AISLE";
                    saveSeatSafe(train.getTrainId(), "C2", s, "CC", berth);
                }
            } else {
                // Standard Express / Rajdhani / Superfast coach composition
                // 2A (A1): 6 seats
                for (int s = 1; s <= 6; s++) {
                    String berth = (s % 2 == 1) ? "LOWER" : "UPPER";
                    saveSeatSafe(train.getTrainId(), "A1", s, "2A", berth);
                }
                // 3A (B1): 8 seats
                for (int s = 1; s <= 8; s++) {
                    String berth = switch (s % 4) {
                        case 1 -> "LOWER";
                        case 2 -> "MIDDLE";
                        case 3 -> "UPPER";
                        default -> "SIDE_LOWER";
                    };
                    saveSeatSafe(train.getTrainId(), "B1", s, "3A", berth);
                }
                // SL (S1): 12 seats
                for (int s = 1; s <= 12; s++) {
                    String berth = switch (s % 4) {
                        case 1 -> "LOWER";
                        case 2 -> "MIDDLE";
                        case 3 -> "UPPER";
                        default -> "SIDE_LOWER";
                    };
                    saveSeatSafe(train.getTrainId(), "S1", s, "SL", berth);
                }
            }
        } catch (Exception e) {
            log.error("Error ensuring seats for train {}: {}", train.getTrainId(), e.getMessage());
        }
    }

    private void saveSeatSafe(Long trainId, String coach, int seatNum, String coachClass, String berth) {
        try {
            seatRepository.save(Seat.builder()
                    .trainId(trainId)
                    .coachNumber(coach)
                    .seatNumber(seatNum)
                    .coachClass(coachClass)
                    .berthType(berth)
                    .build());
        } catch (Exception ignored) {
        }
    }

    private LocalTime parseTime(String timeStr, LocalTime fallback) {
        if (timeStr == null || timeStr.trim().isEmpty()) return fallback;
        try {
            String clean = timeStr.trim();
            String[] parts = clean.split(":");
            if (parts.length >= 2) {
                int h = Integer.parseInt(parts[0].trim());
                int m = Integer.parseInt(parts[1].trim());
                return LocalTime.of(h, m);
            }
            return LocalTime.parse(clean);
        } catch (Exception e) {
            return fallback;
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

        Train saved = trainRepository.save(train);
        ensureSeatsExist(saved);
        return saved;
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

        // Auto-provision schedules for this train once route stops are registered
        autoGenerateSchedulesForTrain(trainId, 14);

        return stop;
    }

    public long getTrainCount() {
        return trainRepository.count();
    }
}
