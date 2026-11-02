package com.railway.reservation.exception;

import com.railway.reservation.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler providing uniform error payloads across REST endpoints.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<ErrorDetails>> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        ErrorDetails details = ErrorDetails.builder()
                .timestamp(LocalDateTime.now())
                .message(ex.getMessage())
                .details(request.getDescription(false))
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.<ErrorDetails>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(details)
                        .build());
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<ErrorDetails>> handleDuplicateResourceException(
            DuplicateResourceException ex, WebRequest request) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        ErrorDetails details = ErrorDetails.builder()
                .timestamp(LocalDateTime.now())
                .message(ex.getMessage())
                .details(request.getDescription(false))
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<ErrorDetails>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(details)
                        .build());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<ErrorDetails>> handleBusinessException(
            BusinessException ex, WebRequest request) {
        log.warn("Business rule violation: {}", ex.getMessage());
        ErrorDetails details = ErrorDetails.builder()
                .timestamp(LocalDateTime.now())
                .message(ex.getMessage())
                .details(request.getDescription(false))
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<ErrorDetails>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(details)
                        .build());
    }

    @ExceptionHandler(DatabaseOperationException.class)
    public ResponseEntity<ApiResponse<ErrorDetails>> handleDatabaseOperationException(
            DatabaseOperationException ex, WebRequest request) {
        log.error("Database operation failed: {}", ex.getMessage(), ex);

        // Check if Oracle user-defined error range (ORA-20000 to ORA-20999)
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (ex.getOracleErrorCode() != null && ex.getOracleErrorCode() >= 20000 && ex.getOracleErrorCode() <= 20999) {
            status = HttpStatus.BAD_REQUEST;
        }

        ErrorDetails details = ErrorDetails.builder()
                .timestamp(LocalDateTime.now())
                .message(ex.getMessage())
                .errorCode(ex.getOracleErrorCode())
                .details(request.getDescription(false))
                .build();

        return ResponseEntity.status(status)
                .body(ApiResponse.<ErrorDetails>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(details)
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<ErrorDetails>> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        ErrorDetails details = ErrorDetails.builder()
                .timestamp(LocalDateTime.now())
                .message("Validation failed for input arguments")
                .details(request.getDescription(false))
                .fieldErrors(errors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<ErrorDetails>builder()
                        .success(false)
                        .message("Validation failed")
                        .data(details)
                        .build());
    }

    @ExceptionHandler({SQLException.class, DataAccessException.class})
    public ResponseEntity<ApiResponse<ErrorDetails>> handleSqlException(
            Exception ex, WebRequest request) {
        log.error("Low-level JDBC/SQL error occurred", ex);

        String message = ex.getMessage();
        int errorCode = 0;
        if (ex instanceof SQLException sqlEx) {
            errorCode = sqlEx.getErrorCode();
        }

        HttpStatus status = (errorCode >= 20000 && errorCode <= 20999) ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;

        ErrorDetails details = ErrorDetails.builder()
                .timestamp(LocalDateTime.now())
                .message(message)
                .errorCode(errorCode)
                .details(request.getDescription(false))
                .build();

        return ResponseEntity.status(status)
                .body(ApiResponse.<ErrorDetails>builder()
                        .success(false)
                        .message("Database error: " + message)
                        .data(details)
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<ErrorDetails>> handleGenericException(
            Exception ex, WebRequest request) {
        log.error("Unhandled server exception", ex);
        ErrorDetails details = ErrorDetails.builder()
                .timestamp(LocalDateTime.now())
                .message(ex.getMessage())
                .details(request.getDescription(false))
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<ErrorDetails>builder()
                        .success(false)
                        .message("An unexpected internal error occurred")
                        .data(details)
                        .build());
    }
}
