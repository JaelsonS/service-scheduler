package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyRegisteredException extends BusinessException {

    public EmailAlreadyRegisteredException() {
        super(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "E-mail already registered");
    }
}
