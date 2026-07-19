package com.jaelson.backend.utils;

import com.jaelson.backend.config.BusinessHours;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public final class AvailabilitySlotGenerator {

    private AvailabilitySlotGenerator() {
    }

    public static List<LocalTime> generateAvailableSlots(
            LocalDate date,
            Set<LocalTime> occupiedTimes,
            LocalDateTime now
    ) {
        List<LocalTime> availableSlots = new ArrayList<>();
        LocalTime slot = LocalTime.of(BusinessHours.START_HOUR, 0);
        LocalTime lastSlot = LocalTime.of(BusinessHours.END_HOUR, 0)
                .minusMinutes(BusinessHours.SLOT_INTERVAL_MINUTES);

        while (!slot.isAfter(lastSlot)) {
            boolean isOccupied = occupiedTimes.contains(slot);
            boolean isPast = date.isEqual(now.toLocalDate()) && slot.isBefore(now.toLocalTime());

            if (!isOccupied && !isPast) {
                availableSlots.add(slot);
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
}
