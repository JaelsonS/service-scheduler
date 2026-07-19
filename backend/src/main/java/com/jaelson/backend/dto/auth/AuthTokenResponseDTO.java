package com.jaelson.backend.dto.auth;

public record AuthTokenResponseDTO(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        String email
) {
}
