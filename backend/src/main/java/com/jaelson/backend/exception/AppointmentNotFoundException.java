package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class AppointmentNotFoundException extends BusinessException {

    public AppointmentNotFoundException(Long appointmentId) {
        super(
                HttpStatus.NOT_FOUND,
                "APPOINTMENT_NOT_FOUND",
                "Agendamento não encontrado"
        );
    }
}
