package com.jaelson.backend.service;

import com.jaelson.backend.dto.auth.AuthTokenResponseDTO;
import com.jaelson.backend.dto.auth.LoginRequestDTO;
import com.jaelson.backend.entity.AdminUser;
import com.jaelson.backend.entity.ClientUser;
import com.jaelson.backend.enums.UserRole;
import com.jaelson.backend.exception.AuthenticationFailedException;
import com.jaelson.backend.exception.InvalidRefreshTokenException;
import com.jaelson.backend.repository.AdminUserRepository;
import com.jaelson.backend.repository.ClientUserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

/**
 * Login do admin + renovação/logout de tokens.
 * O AuthenticationManager valida a senha (BCrypt); daí em diante só emito JWT.
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AdminUserRepository adminUserRepository;
    private final ClientUserRepository clientUserRepository;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            AdminUserRepository adminUserRepository,
            ClientUserRepository clientUserRepository,
            JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.adminUserRepository = adminUserRepository;
        this.clientUserRepository = clientUserRepository;
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

        return createTokenResponse(user.getEmail(), UserRole.ADMIN);
    }

    public AuthTokenResponseDTO refresh(String refreshToken) {
        try {
            Claims claims = jwtService.parseRefreshToken(refreshToken);
            UserRole role = jwtService.extractRole(claims);
            String email = claims.getSubject();

            return switch (role) {
                case ADMIN -> {
                    AdminUser user = adminUserRepository.findByEmailIgnoreCase(email)
                            .filter(AdminUser::isActive)
                            .orElseThrow(InvalidRefreshTokenException::new);
                    yield createTokenResponse(user.getEmail(), UserRole.ADMIN);
                }
                case CLIENT -> {
                    ClientUser user = clientUserRepository.findByEmailIgnoreCase(email)
                            .filter(ClientUser::isActive)
                            .orElseThrow(InvalidRefreshTokenException::new);
                    yield createTokenResponse(user.getEmail(), UserRole.CLIENT);
                }
            };
        } catch (JwtException | IllegalArgumentException exception) {
            throw new InvalidRefreshTokenException();
        }
    }

    public void logout(String refreshToken) {
        jwtService.revokeRefreshToken(refreshToken);
    }

    private AuthTokenResponseDTO createTokenResponse(String email, UserRole role) {
        return new AuthTokenResponseDTO(
                jwtService.createAccessToken(email, role),
                jwtService.createRefreshToken(email, role),
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds(),
                email,
                role.name()
        );
    }
}
