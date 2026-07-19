package com.jaelson.backend.controller;

import com.jaelson.backend.dto.auth.AuthTokenResponseDTO;
import com.jaelson.backend.dto.auth.ClientProfileResponseDTO;
import com.jaelson.backend.dto.auth.ClientRegisterRequestDTO;
import com.jaelson.backend.dto.auth.LoginRequestDTO;
import com.jaelson.backend.service.ClientAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client")
public class ClientAuthController {

    private final ClientAuthService clientAuthService;

    public ClientAuthController(ClientAuthService clientAuthService) {
        this.clientAuthService = clientAuthService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<AuthTokenResponseDTO> register(@Valid @RequestBody ClientRegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientAuthService.register(request));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthTokenResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(clientAuthService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<ClientProfileResponseDTO> me(Authentication authentication) {
        return ResponseEntity.ok(clientAuthService.getProfile(authentication.getName()));
    }
}
