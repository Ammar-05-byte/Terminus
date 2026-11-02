package com.railway.reservation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Entry Point for Railway Reservation System.
 * Pure JDBC architecture with Oracle Database backend.
 */
@SpringBootApplication
public class RailwayReservationApplication {

    public static void main(String[] args) {
        SpringApplication.run(RailwayReservationApplication.class, args);
    }
}
