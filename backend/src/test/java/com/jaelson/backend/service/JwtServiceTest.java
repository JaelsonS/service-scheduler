package com.jaelson.backend.service;

import com.jaelson.backend.config.JwtProperties;
import com.jaelson.backend.enums.UserRole;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            new JwtProperties("test-secret-that-is-at-least-thirty-two-bytes-long", 30, 7),
            Clock.fixed(Instant.parse("2026-07-17T10:00:00Z"), ZoneOffset.UTC)
    );

    @Test
    void shouldCreateAndParseAccessTokenWithRole() {
        String token = jwtService.createAccessToken("admin@example.com", UserRole.ADMIN);

        assertEquals("admin@example.com", jwtService.parseAccessToken(token).getSubject());
        assertEquals(JwtService.ACCESS_TOKEN_TYPE,
                jwtService.parseAccessToken(token).get(JwtService.TOKEN_TYPE_CLAIM, String.class));
        assertEquals(UserRole.ADMIN, jwtService.extractRole(jwtService.parseAccessToken(token)));
    }

    @Test
    void shouldRejectRefreshTokenAsAccessToken() {
        String token = jwtService.createRefreshToken("admin@example.com", UserRole.ADMIN);

        assertThrows(JwtException.class, () -> jwtService.parseAccessToken(token));
    }

    @Test
    void shouldRejectRevokedRefreshToken() {
        String token = jwtService.createRefreshToken("client@example.com", UserRole.CLIENT);
        jwtService.revokeRefreshToken(token);

        assertThrows(JwtException.class, () -> jwtService.parseRefreshToken(token));
    }
}
