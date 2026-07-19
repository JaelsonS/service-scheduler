package com.jaelson.backend.dto.appointment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentCreateRequestDTO(
        @NotBlank(message = "Customer name is required")
        @Size(max = 120, message = "Customer name must have at most 120 characters")
        String customerName,

        @NotBlank(message = "Customer phone is required")
        @Size(max = 30, message = "Customer phone must have at most 30 characters")
        @Pattern(
                regexp = "^[0-9()+.\\- ]{10,30}$",
                message = "Customer phone has an invalid format"
        )
        String customerPhone,

        @NotNull(message = "Appointment date is required")
        LocalDate appointmentDate,

        @NotNull(message = "Appointment time is required")
        LocalTime appointmentTime,

        @NotNull(message = "Service is required")
        @Positive(message = "Service must be a positive identifier")
        Long serviceId
) {
}
