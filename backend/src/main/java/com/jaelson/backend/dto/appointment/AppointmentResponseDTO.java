package com.jaelson.backend.dto.appointment;

import com.jaelson.backend.dto.service.ServiceResponseDTO;
import com.jaelson.backend.enums.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AppointmentResponseDTO(
        Long id,
        String customerName,
        String customerPhone,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        AppointmentStatus status,
        ServiceResponseDTO service,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}