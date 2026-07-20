package com.jaelson.backend.utils;

import com.jaelson.backend.config.BusinessHours;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Gera a grade de horários a partir de BusinessHours.
 * Cada slot precisa caber a duração do serviço sem sobrepor agendamentos ativos
 * (intervalo [início, início + duração)).
 */
public final class AvailabilitySlotGenerator {

    private AvailabilitySlotGenerator() {
    }

    public record OccupiedInterval(LocalTime start, LocalTime end) {
        public boolean overlaps(LocalTime candidateStart, LocalTime candidateEnd) {
            return candidateStart.isBefore(end) && start.isBefore(candidateEnd);
        }
    }

    public static List<LocalTime> generateAvailableSlots(
            LocalDate date,
            List<OccupiedInterval> occupied,
            int durationMinutes,
            LocalDateTime now
    ) {
        int safeDuration = Math.max(durationMinutes, BusinessHours.SLOT_INTERVAL_MINUTES);
        List<LocalTime> availableSlots = new ArrayList<>();
        LocalTime slot = LocalTime.of(BusinessHours.START_HOUR, 0);
        LocalTime dayEnd = LocalTime.of(BusinessHours.END_HOUR, 0);
        LocalTime lastStart = dayEnd.minusMinutes(safeDuration);

        while (!slot.isAfter(lastStart)) {
            final LocalTime candidateStart = slot;
            final LocalTime candidateEnd = candidateStart.plusMinutes(safeDuration);
            boolean overlaps = occupied.stream()
                    .anyMatch(item -> item.overlaps(candidateStart, candidateEnd));
            boolean isPast = date.isEqual(now.toLocalDate())
                    && candidateStart.isBefore(now.toLocalTime());

            if (!overlaps && !isPast) {
                availableSlots.add(candidateStart);
            }

            slot = slot.plusMinutes(BusinessHours.SLOT_INTERVAL_MINUTES);
        }

        return availableSlots;
    }

    public static boolean isWithinBusinessHours(LocalTime time) {
        LocalTime start = LocalTime.of(BusinessHours.START_HOUR, 0);
        LocalTime end = LocalTime.of(BusinessHours.END_HOUR, 0);
        return !time.isBefore(start)
                && time.isBefore(end)
                && time.getMinute() % BusinessHours.SLOT_INTERVAL_MINUTES == 0
                && time.getSecond() == 0
                && time.getNano() == 0;
    }

    public static boolean fitsInBusinessHours(LocalTime start, int durationMinutes) {
        if (!isWithinBusinessHours(start)) {
            return false;
        }
        LocalTime dayEnd = LocalTime.of(BusinessHours.END_HOUR, 0);
        LocalTime end = start.plusMinutes(Math.max(durationMinutes, 1));
        return !end.isAfter(dayEnd);
    }
}
