package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidAppointmentStatusException extends BusinessException {

    public InvalidAppointmentStatusException(String message) {
        super(HttpStatus.BAD_REQUEST, "INVALID_APPOINTMENT_STATUS", message);
    }
}