package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class AuthenticationFailedException extends BusinessException {

    public AuthenticationFailedException() {
        super(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "E-mail ou senha inválidos");
    }
}
