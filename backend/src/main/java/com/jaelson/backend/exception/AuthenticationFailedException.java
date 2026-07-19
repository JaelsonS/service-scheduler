package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class AuthenticationFailedException extends BusinessException {

    public AuthenticationFailedException() {
        super(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "Invalid email or password");
    }
}
