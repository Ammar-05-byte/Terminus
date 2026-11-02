package com.railway.reservation.service;

import com.railway.reservation.dto.ScheduleRequest;
import com.railway.reservation.exception.BusinessException;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.TrainSchedule;
import com.railway.reservation.repository.ScheduleRepository;
import com.railway.reservation.repository.StationRepository;
import com.railway.reservation.repository.TrainRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Service managing Train Schedules.
 */
@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final TrainRepository trainRepository;
    private final StationRepository stationRepository;

    public ScheduleService(ScheduleRepository scheduleRepository,
                           TrainRepository trainRepository,
                           StationRepository stationRepository) {
        this.scheduleRepository = scheduleRepository;
        this.trainRepository = trainRepository;
        this.stationRepository = stationRepository;
    }

    public List<TrainSchedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    public TrainSchedule getScheduleById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainSchedule", "id", id));
    }

    public List<TrainSchedule> getSchedulesByTrainAndDate(Long trainId, LocalDate date) {
        trainRepository.findById(trainId)
                .orElseThrow(() -> new ResourceNotFoundException("Train", "id", trainId));
        return scheduleRepository.findByTrainAndDate(trainId, date);
    }

    public List<TrainSchedule> getUpcomingFromStation(Long stationId) {
        stationRepository.findById(stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Station", "id", stationId));
        return scheduleRepository.findUpcomingFromStation(stationId);
    }

    public TrainSchedule createSchedule(ScheduleRequest request) {
        trainRepository.findById(request.getTrainId())
                .orElseThrow(() -> new ResourceNotFoundException("Train", "id", request.getTrainId()));

        if (request.getScheduledDeparture().isAfter(request.getScheduledArrival())) {
            throw new BusinessException("Scheduled departure cannot be after scheduled arrival");
        }

        TrainSchedule schedule = TrainSchedule.builder()
                .trainId(request.getTrainId())
                .journeyDate(request.getJourneyDate())
                .scheduledDeparture(request.getScheduledDeparture())
                .scheduledArrival(request.getScheduledArrival())
                .scheduleStatus(request.getScheduleStatus() != null ? request.getScheduleStatus() : "SCHEDULED")
                .build();

        return scheduleRepository.save(schedule);
    }

    public TrainSchedule updateSchedule(Long id, ScheduleRequest request) {
        TrainSchedule existing = getScheduleById(id);
        trainRepository.findById(request.getTrainId())
                .orElseThrow(() -> new ResourceNotFoundException("Train", "id", request.getTrainId()));

        if (request.getScheduledDeparture().isAfter(request.getScheduledArrival())) {
            throw new BusinessException("Scheduled departure cannot be after scheduled arrival");
        }

        existing.setTrainId(request.getTrainId());
        existing.setJourneyDate(request.getJourneyDate());
        existing.setScheduledDeparture(request.getScheduledDeparture());
        existing.setScheduledArrival(request.getScheduledArrival());
        existing.setScheduleStatus(request.getScheduleStatus());

        scheduleRepository.update(existing);
        return existing;
    }

    public void deleteSchedule(Long id) {
        getScheduleById(id);
        scheduleRepository.delete(id);
    }

    public long getScheduleCount() {
        return scheduleRepository.count();
    }
}
