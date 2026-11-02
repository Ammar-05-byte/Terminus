package com.railway.reservation.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when low-level JDBC or PL/SQL errors occur during stored procedure / query execution.
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class DatabaseOperationException extends RuntimeException {

    private final Integer oracleErrorCode;

    public DatabaseOperationException(String message) {
        super(message);
        this.oracleErrorCode = null;
    }

    public DatabaseOperationException(String message, Throwable cause) {
        super(message, cause);
        this.oracleErrorCode = null;
    }

    public DatabaseOperationException(String message, int oracleErrorCode, Throwable cause) {
        super(String.format("Oracle Error [%d]: %s", oracleErrorCode, message), cause);
        this.oracleErrorCode = oracleErrorCode;
    }

    public Integer getOracleErrorCode() {
        return oracleErrorCode;
    }
}
