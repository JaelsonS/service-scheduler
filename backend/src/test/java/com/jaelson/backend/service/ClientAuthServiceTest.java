package com.jaelson.backend.service;

import com.jaelson.backend.dto.auth.AuthTokenResponseDTO;
import com.jaelson.backend.dto.auth.ClientRegisterRequestDTO;
import com.jaelson.backend.dto.auth.LoginRequestDTO;
import com.jaelson.backend.entity.ClientUser;
import com.jaelson.backend.enums.UserRole;
import com.jaelson.backend.exception.AuthenticationFailedException;
import com.jaelson.backend.exception.EmailAlreadyRegisteredException;
import com.jaelson.backend.repository.ClientUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientAuthServiceTest {

    @Mock
    private ClientUserRepository clientUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private ClientAuthService clientAuthService;

    @BeforeEach
    void setUp() {
        clientAuthService = new ClientAuthService(clientUserRepository, passwordEncoder, jwtService);
    }

    @Test
    void shouldRegisterNewClient() {
        when(clientUserRepository.existsByEmailIgnoreCase("client@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(jwtService.createAccessToken("client@example.com", UserRole.CLIENT)).thenReturn("access");
        when(jwtService.createRefreshToken("client@example.com", UserRole.CLIENT)).thenReturn("refresh");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(1800L);
        when(clientUserRepository.save(any(ClientUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthTokenResponseDTO response = clientAuthService.register(new ClientRegisterRequestDTO(
                "Ana Silva",
                "+5511999998888",
                "client@example.com",
                "password123"
        ));

        ArgumentCaptor<ClientUser> captor = ArgumentCaptor.forClass(ClientUser.class);
        verify(clientUserRepository).save(captor.capture());
        assertEquals("Ana Silva", captor.getValue().getFullName());
        assertEquals("CLIENT", response.role());
        assertEquals("access", response.accessToken());
    }

    @Test
    void shouldRejectDuplicateEmail() {
        when(clientUserRepository.existsByEmailIgnoreCase("client@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyRegisteredException.class, () -> clientAuthService.register(
                new ClientRegisterRequestDTO("Ana", "+5511999998888", "client@example.com", "password123")
        ));
    }

    @Test
    void shouldLoginWithValidPassword() {
        ClientUser user = new ClientUser("client@example.com", "hashed", "Ana", "11999998888");
        when(clientUserRepository.findByEmailIgnoreCase("client@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtService.createAccessToken("client@example.com", UserRole.CLIENT)).thenReturn("access");
        when(jwtService.createRefreshToken("client@example.com", UserRole.CLIENT)).thenReturn("refresh");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(1800L);

        AuthTokenResponseDTO response = clientAuthService.login(
                new LoginRequestDTO("client@example.com", "password123")
        );

        assertEquals("client@example.com", response.email());
        assertEquals("CLIENT", response.role());
    }

    @Test
    void shouldRejectInvalidPassword() {
        ClientUser user = new ClientUser("client@example.com", "hashed", "Ana", "11999998888");
        when(clientUserRepository.findByEmailIgnoreCase("client@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThrows(AuthenticationFailedException.class, () -> clientAuthService.login(
                new LoginRequestDTO("client@example.com", "wrong")
        ));
    }
}
