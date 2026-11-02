package com.railway.reservation.service;

import com.railway.reservation.dto.QueryResultResponse;
import com.railway.reservation.repository.AdminRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Service managing Database Operations Lab queries and administrative diagnostics.
 */
@Service
public class AdminService {

    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public QueryResultResponse executeQuery(String queryId) {
        return adminRepository.executeQuery(queryId);
    }

    public Map<String, String> getAvailableQueries() {
        return adminRepository.getAvailableQueries();
    }
}
