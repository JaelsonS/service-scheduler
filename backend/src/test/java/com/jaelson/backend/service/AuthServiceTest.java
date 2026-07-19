package com.jaelson.backend.service;

import com.jaelson.backend.dto.auth.AuthTokenResponseDTO;
import com.jaelson.backend.dto.auth.LoginRequestDTO;
import com.jaelson.backend.entity.AdminUser;
import com.jaelson.backend.enums.UserRole;
import com.jaelson.backend.exception.AuthenticationFailedException;
import com.jaelson.backend.exception.InvalidRefreshTokenException;
import com.jaelson.backend.repository.AdminUserRepository;
import com.jaelson.backend.repository.ClientUserRepository;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private AdminUserRepository adminUserRepository;

    @Mock
    private ClientUserRepository clientUserRepository;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                authenticationManager,
                adminUserRepository,
                clientUserRepository,
                jwtService
        );
    }

    @Test
    void shouldIssueTokensAfterSuccessfulLogin() {
        AdminUser user = new AdminUser("admin@example.com", "hashed-password");
        when(adminUserRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenReturn(
                UsernamePasswordAuthenticationToken.authenticated("admin@example.com", null, java.util.List.of())
        );
        when(jwtService.createAccessToken("admin@example.com", UserRole.ADMIN)).thenReturn("access-token");
        when(jwtService.createRefreshToken("admin@example.com", UserRole.ADMIN)).thenReturn("refresh-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(1800L);

        AuthTokenResponseDTO result = authService.login(new LoginRequestDTO("admin@example.com", "password"));

        assertEquals("access-token", result.accessToken());
        assertEquals("refresh-token", result.refreshToken());
        assertEquals("Bearer", result.tokenType());
        assertEquals("ADMIN", result.role());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void shouldRejectInvalidCredentials() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(
                AuthenticationFailedException.class,
                () -> authService.login(new LoginRequestDTO("admin@example.com", "wrong-password"))
        );
    }

    @Test
    void shouldRejectRefreshTokenForMissingUser() {
        Claims claims = org.mockito.Mockito.mock(Claims.class);
        when(jwtService.parseRefreshToken("refresh-token")).thenReturn(claims);
        when(jwtService.extractRole(claims)).thenReturn(UserRole.ADMIN);
        when(claims.getSubject()).thenReturn("admin@example.com");
        when(adminUserRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.empty());

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh("refresh-token"));
    }
}
