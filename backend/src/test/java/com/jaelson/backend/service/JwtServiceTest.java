package com.jaelson.backend.service;

import com.jaelson.backend.config.JwtProperties;
import com.jaelson.backend.entity.RevokedRefreshToken;
import com.jaelson.backend.enums.UserRole;
import com.jaelson.backend.repository.RevokedRefreshTokenRepository;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock
    private RevokedRefreshTokenRepository revokedRefreshTokenRepository;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                new JwtProperties("test-secret-that-is-at-least-thirty-two-bytes-long", 30, 7),
                Clock.fixed(Instant.parse("2026-07-17T10:00:00Z"), ZoneOffset.UTC),
                revokedRefreshTokenRepository
        );
    }

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
        String hash = JwtService.sha256(token);
        when(revokedRefreshTokenRepository.existsByTokenHashAndExpiresAtAfter(eq(hash), any()))
                .thenReturn(true);

        assertThrows(JwtException.class, () -> jwtService.parseRefreshToken(token));
    }

    @Test
    void shouldPersistRevokedRefreshTokenHash() {
        String token = jwtService.createRefreshToken("client@example.com", UserRole.CLIENT);
        when(revokedRefreshTokenRepository.existsById(any())).thenReturn(false);

        jwtService.revokeRefreshToken(token);

        ArgumentCaptor<RevokedRefreshToken> captor = ArgumentCaptor.forClass(RevokedRefreshToken.class);
        verify(revokedRefreshTokenRepository).save(captor.capture());
        assertEquals(JwtService.sha256(token), captor.getValue().getTokenHash());
    }

    @Test
    void shouldIgnoreAlreadyRevokedRefreshToken() {
        String token = jwtService.createRefreshToken("client@example.com", UserRole.CLIENT);
        when(revokedRefreshTokenRepository.existsById(JwtService.sha256(token))).thenReturn(true);

        jwtService.revokeRefreshToken(token);

        verify(revokedRefreshTokenRepository, never()).save(any());
    }
}
