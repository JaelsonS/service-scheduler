package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class ServiceNotFoundException extends BusinessException {

    public ServiceNotFoundException(Long serviceId) {
        super(
                HttpStatus.NOT_FOUND,
                "SERVICE_NOT_FOUND",
                "Serviço não encontrado"
        );
    }
}
