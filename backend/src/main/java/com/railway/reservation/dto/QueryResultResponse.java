package com.railway.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Generic query execution output for Database Operations Lab.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueryResultResponse {
    private String queryId;
    private String description;
    private long executionTimeMs;
    @Builder.Default
    private List<String> columns = new ArrayList<>();
    @Builder.Default
    private List<Map<String, Object>> rows = new ArrayList<>();
}
