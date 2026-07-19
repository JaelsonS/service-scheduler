package com.jaelson.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        String secret,
        long accessTokenExpirationMinutes,
        long refreshTokenExpirationDays
) {
}
