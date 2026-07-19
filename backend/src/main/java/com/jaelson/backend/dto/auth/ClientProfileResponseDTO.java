package com.jaelson.backend.dto.auth;

public record ClientProfileResponseDTO(
        Long id,
        String email,
        String fullName,
        String phone
) {
}
