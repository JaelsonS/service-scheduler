package com.jaelson.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidRefreshTokenException extends BusinessException {

    public InvalidRefreshTokenException() {
        super(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Sessão expirada. Faça login novamente");
    }
}
