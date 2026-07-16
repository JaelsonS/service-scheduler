package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class AppointmentConflictException extends BusinessException {

    public AppointmentConflictException(String message) {
        super(HttpStatus.CONFLICT, "APPOINTMENT_CONFLICT", message);
    }
}