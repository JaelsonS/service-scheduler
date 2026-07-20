package com.jaelson.backend.dto.appointment;

import com.jaelson.backend.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public record AppointmentStatusUpdateRequestDTO(
        @NotNull(message = "Informe o status")
        AppointmentStatus status
) {
}
