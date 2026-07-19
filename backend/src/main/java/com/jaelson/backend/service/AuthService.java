package com.jaelson.backend.service;

import com.jaelson.backend.dto.auth.AuthTokenResponseDTO;
import com.jaelson.backend.dto.auth.LoginRequestDTO;
import com.jaelson.backend.entity.AdminUser;
import com.jaelson.backend.exception.AuthenticationFailedException;
import com.jaelson.backend.exception.InvalidRefreshTokenException;
import com.jaelson.backend.repository.AdminUserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AdminUserRepository adminUserRepository;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            AdminUserRepository adminUserRepository,
            JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.adminUserRepository = adminUserRepository;
        this.jwtService = jwtService;
    }

    public AuthTokenResponseDTO login(LoginRequestDTO request) {
        try {
            authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password())
            );
        } catch (AuthenticationException exception) {
            throw new AuthenticationFailedException();
        }

        AdminUser user = adminUserRepository.findByEmailIgnoreCase(request.email())
                .filter(AdminUser::isActive)
                .orElseThrow(AuthenticationFailedException::new);

        return createTokenResponse(user.getEmail());
    }

    public AuthTokenResponseDTO refresh(String refreshToken) {
        try {
            Claims claims = jwtService.parseRefreshToken(refreshToken);
            AdminUser user = adminUserRepository.findByEmailIgnoreCase(claims.getSubject())
                    .filter(AdminUser::isActive)
                    .orElseThrow(InvalidRefreshTokenException::new);
            return createTokenResponse(user.getEmail());
        } catch (JwtException | IllegalArgumentException exception) {
            throw new InvalidRefreshTokenException();
        }
    }

    public void logout(String refreshToken) {
        jwtService.revokeRefreshToken(refreshToken);
    }

    private AuthTokenResponseDTO createTokenResponse(String email) {
        return new AuthTokenResponseDTO(
                jwtService.createAccessToken(email),
                jwtService.createRefreshToken(email),
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds(),
                email
        );
    }
}
