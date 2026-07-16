package com.jaelson.backend.dto.error;

import java.time.Instant;
import java.util.Map;

public record ErrorResponseDTO(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
}