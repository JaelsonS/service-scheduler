package com.jaelson.backend.utils;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AvailabilitySlotGeneratorTest {

    @Test
    void shouldExcludeOccupiedAndPastSlotsForToday() {
        LocalDate today = LocalDate.of(2026, 7, 16);
        LocalDateTime now = LocalDateTime.of(today, LocalTime.of(10, 15));
        Set<LocalTime> occupied = Set.of(LocalTime.of(11, 0));

        List<LocalTime> slots = AvailabilitySlotGenerator.generateAvailableSlots(today, occupied, now);

        assertFalse(slots.contains(LocalTime.of(9, 0)));
        assertFalse(slots.contains(LocalTime.of(10, 0)));
        assertFalse(slots.contains(LocalTime.of(11, 0)));
        assertTrue(slots.contains(LocalTime.of(10, 30)));
        assertTrue(slots.contains(LocalTime.of(11, 30)));
    }

    @Test
    void shouldAllowSlotThatMatchesNow() {
        LocalDate today = LocalDate.of(2026, 7, 16);
        LocalDateTime now = LocalDateTime.of(today, LocalTime.of(10, 0));

        List<LocalTime> slots = AvailabilitySlotGenerator.generateAvailableSlots(
                today,
                Set.of(),
                now
        );

        assertTrue(slots.contains(LocalTime.of(10, 0)));
    }

    @Test
    void shouldReturnFullDayWhenFutureDateHasNoOccupation() {
        LocalDate futureDate = LocalDate.of(2026, 7, 20);
        LocalDateTime now = LocalDateTime.of(2026, 7, 16, 12, 0);

        List<LocalTime> slots = AvailabilitySlotGenerator.generateAvailableSlots(
                futureDate,
                Set.of(),
                now
        );

        assertEquals(LocalTime.of(9, 0), slots.getFirst());
        assertEquals(LocalTime.of(17, 30), slots.getLast());
        assertEquals(18, slots.size());
    }

    @Test
    void shouldValidateBusinessHourSlots() {
        assertTrue(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(9, 0)));
        assertTrue(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(17, 30)));
        assertFalse(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(8, 30)));
        assertFalse(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(18, 0)));
        assertFalse(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(10, 15)));
    }
}
