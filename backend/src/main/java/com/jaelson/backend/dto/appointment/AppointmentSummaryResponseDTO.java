package com.jaelson.backend.dto.appointment;

import com.jaelson.backend.enums.AppointmentStatus;

import java.util.Map;

public record AppointmentSummaryResponseDTO(
        long total,
        Map<AppointmentStatus, Long> byStatus
) {
}
