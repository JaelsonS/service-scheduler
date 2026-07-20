package com.jaelson.backend.validation;

import com.jaelson.backend.enums.AppointmentStatus;
import com.jaelson.backend.exception.InvalidAppointmentStatusException;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Máquina de estados dos agendamentos.
 * AGENDADO → CONFIRMADO | CANCELADO
 * CONFIRMADO → CONCLUIDO | CANCELADO
 * Estados finais não voltam atrás — evita "desconcluir" por engano no admin.
 */
public final class AppointmentStatusTransitionValidator {

    private static final Map<AppointmentStatus, Set<AppointmentStatus>> ALLOWED_TRANSITIONS =
            new EnumMap<>(AppointmentStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(
                AppointmentStatus.AGENDADO,
                EnumSet.of(AppointmentStatus.CONFIRMADO, AppointmentStatus.CANCELADO)
        );
        ALLOWED_TRANSITIONS.put(
                AppointmentStatus.CONFIRMADO,
                EnumSet.of(AppointmentStatus.CONCLUIDO, AppointmentStatus.CANCELADO)
        );
        ALLOWED_TRANSITIONS.put(AppointmentStatus.CONCLUIDO, EnumSet.noneOf(AppointmentStatus.class));
        ALLOWED_TRANSITIONS.put(AppointmentStatus.CANCELADO, EnumSet.noneOf(AppointmentStatus.class));
    }

    private AppointmentStatusTransitionValidator() {
    }

    public static void validate(AppointmentStatus currentStatus, AppointmentStatus targetStatus) {
        if (currentStatus == targetStatus) {
            throw new InvalidAppointmentStatusException(
                    "O agendamento já está com status " + targetStatus
            );
        }

        Set<AppointmentStatus> allowedTargets = ALLOWED_TRANSITIONS.getOrDefault(
                currentStatus,
                EnumSet.noneOf(AppointmentStatus.class)
        );

        if (!allowedTargets.contains(targetStatus)) {
            throw new InvalidAppointmentStatusException(
                    "Não é possível mudar de " + currentStatus + " para " + targetStatus
            );
        }
    }
}
