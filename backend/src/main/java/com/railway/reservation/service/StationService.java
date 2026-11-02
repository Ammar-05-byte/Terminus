package com.railway.reservation.service;

import com.railway.reservation.dto.StationRequest;
import com.railway.reservation.exception.DuplicateResourceException;
import com.railway.reservation.exception.ResourceNotFoundException;
import com.railway.reservation.model.Station;
import com.railway.reservation.repository.StationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service managing Railway Stations.
 */
@Service
public class StationService {

    private final StationRepository stationRepository;

    public StationService(StationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    public Station getStationById(Long id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Station", "id", id));
    }

    public Station getStationByCode(String code) {
        return stationRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Station", "code", code));
    }

    public Station createStation(StationRequest request) {
        stationRepository.findByCode(request.getStationCode()).ifPresent(s -> {
            throw new DuplicateResourceException("Station", "code", request.getStationCode());
        });

        Station station = Station.builder()
                .stationCode(request.getStationCode().toUpperCase())
                .stationName(request.getStationName())
                .city(request.getCity())
                .state(request.getState())
                .build();

        return stationRepository.save(station);
    }

    public Station updateStation(Long id, StationRequest request) {
        Station existing = getStationById(id);

        existing.setStationCode(request.getStationCode().toUpperCase());
        existing.setStationName(request.getStationName());
        existing.setCity(request.getCity());
        existing.setState(request.getState());

        stationRepository.update(existing);
        return existing;
    }

    public void deleteStation(Long id) {
        getStationById(id);
        stationRepository.delete(id);
    }

    public long getStationCount() {
        return stationRepository.count();
    }
}
