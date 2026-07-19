package com.jaelson.backend.dto.appointment;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AvailabilityResponseDTO(
        LocalDate date,
        List<LocalTime> availableSlots
) {
}
