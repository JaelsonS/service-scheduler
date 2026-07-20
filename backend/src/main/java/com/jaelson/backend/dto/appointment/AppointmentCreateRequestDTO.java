package com.jaelson.backend.dto.appointment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentCreateRequestDTO(
        @NotBlank(message = "Informe o nome")
        @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
        String customerName,

        @NotBlank(message = "Informe o telefone")
        @Size(max = 30, message = "Telefone deve ter no máximo 30 caracteres")
        @Pattern(
                regexp = "^\\+[1-9]\\d{7,14}$",
                message = "Telefone inválido. Use DDI + número (ex.: +5511999998888)"
        )
        String customerPhone,

        @NotNull(message = "Selecione a data")
        LocalDate appointmentDate,

        @NotNull(message = "Selecione o horário")
        LocalTime appointmentTime,

        @NotNull(message = "Selecione o serviço")
        @Positive(message = "Serviço inválido")
        Long serviceId
) {
}
