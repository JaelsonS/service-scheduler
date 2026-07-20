package com.jaelson.backend.service;

import com.jaelson.backend.dto.auth.AuthTokenResponseDTO;
import com.jaelson.backend.dto.auth.ClientRegisterRequestDTO;
import com.jaelson.backend.dto.auth.LoginRequestDTO;
import com.jaelson.backend.entity.ClientUser;
import com.jaelson.backend.enums.UserRole;
import com.jaelson.backend.exception.AuthenticationFailedException;
import com.jaelson.backend.exception.EmailAlreadyRegisteredException;
import com.jaelson.backend.repository.ClientUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cadastro/login do cliente (role CLIENT).
 * E-mail fica normalizado em minúsculas pra evitar duplicata por capitalização.
 */
@Service
public class ClientAuthService {

    private final ClientUserRepository clientUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ClientAuthService(
            ClientUserRepository clientUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.clientUserRepository = clientUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthTokenResponseDTO register(ClientRegisterRequestDTO request) {
        String email = request.email().trim().toLowerCase();
        if (clientUserRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        ClientUser user = new ClientUser(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                request.phone().trim()
        );
        clientUserRepository.save(user);
        return createTokenResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthTokenResponseDTO login(LoginRequestDTO request) {
        ClientUser user = clientUserRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(ClientUser::isActive)
                .orElseThrow(AuthenticationFailedException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthenticationFailedException();
        }

        return createTokenResponse(user);
    }

    @Transactional(readOnly = true)
    public ClientUser requireActiveByEmail(String email) {
        return clientUserRepository.findByEmailIgnoreCase(email)
                .filter(ClientUser::isActive)
                .orElseThrow(AuthenticationFailedException::new);
    }

    @Transactional(readOnly = true)
    public com.jaelson.backend.dto.auth.ClientProfileResponseDTO getProfile(String email) {
        ClientUser user = requireActiveByEmail(email);
        return new com.jaelson.backend.dto.auth.ClientProfileResponseDTO(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone()
        );
    }

    private AuthTokenResponseDTO createTokenResponse(ClientUser user) {
        return new AuthTokenResponseDTO(
                jwtService.createAccessToken(user.getEmail(), UserRole.CLIENT),
                jwtService.createRefreshToken(user.getEmail(), UserRole.CLIENT),
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds(),
                user.getEmail(),
                UserRole.CLIENT.name()
        );
    }
}
