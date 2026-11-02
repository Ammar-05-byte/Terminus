package com.railway.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request payload for Database Lab operations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueryExecutionRequest {

    @NotBlank(message = "Query ID or key is required (e.g. Q01, Q08, Q09, Q10, Q14)")
    private String queryId;

    private Map<String, Object> parameters;
}
