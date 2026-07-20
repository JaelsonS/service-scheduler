package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class InactiveServiceException extends BusinessException {

    public InactiveServiceException(Long serviceId) {
        super(
                HttpStatus.BAD_REQUEST,
                "INACTIVE_SERVICE",
                "Este serviço não está disponível para agendamento"
        );
    }
}
