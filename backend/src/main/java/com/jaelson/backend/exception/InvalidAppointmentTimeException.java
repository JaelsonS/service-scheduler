package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidAppointmentTimeException extends BusinessException {

    public InvalidAppointmentTimeException(String message) {
        super(HttpStatus.BAD_REQUEST, "INVALID_APPOINTMENT_TIME", message);
    }
}
