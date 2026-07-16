package com.jaelson.backend.dto.service;

public record ServiceResponseDTO(
        Long id,
        String name,
        Integer durationMinutes,
        boolean active
) {
}