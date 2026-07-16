package com.jaelson.backend.dto.appointment;

import java.util.List;

public record AppointmentListResponseDTO(
        List<AppointmentResponseDTO> appointments,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}