package com.jaelson.backend.validation;

import com.jaelson.backend.enums.AppointmentStatus;
import com.jaelson.backend.exception.InvalidAppointmentStatusException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AppointmentStatusTransitionValidatorTest {

    @ParameterizedTest
    @CsvSource({
            "AGENDADO, CONFIRMADO",
            "AGENDADO, CANCELADO",
            "CONFIRMADO, CONCLUIDO",
            "CONFIRMADO, CANCELADO"
    })
    void shouldAllowValidTransitions(AppointmentStatus current, AppointmentStatus target) {
        assertDoesNotThrow(() -> AppointmentStatusTransitionValidator.validate(current, target));
    }

    @ParameterizedTest
    @CsvSource({
            "AGENDADO, CONCLUIDO",
            "AGENDADO, AGENDADO",
            "CONFIRMADO, AGENDADO",
            "CONCLUIDO, CANCELADO",
            "CANCELADO, AGENDADO",
            "CANCELADO, CONFIRMADO"
    })
    void shouldRejectInvalidTransitions(AppointmentStatus current, AppointmentStatus target) {
        assertThrows(
                InvalidAppointmentStatusException.class,
                () -> AppointmentStatusTransitionValidator.validate(current, target)
        );
    }

    @Test
    void shouldRejectSameStatus() {
        assertThrows(
                InvalidAppointmentStatusException.class,
                () -> AppointmentStatusTransitionValidator.validate(
                        AppointmentStatus.AGENDADO,
                        AppointmentStatus.AGENDADO
                )
        );
    }
}
