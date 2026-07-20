package com.jaelson.backend.utils;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AvailabilitySlotGeneratorTest {

    @Test
    void shouldExcludePastAndOverlappingSlotsForToday() {
        LocalDate today = LocalDate.of(2026, 7, 16);
        LocalDateTime now = LocalDateTime.of(today, LocalTime.of(10, 15));
        List<AvailabilitySlotGenerator.OccupiedInterval> occupied = List.of(
                new AvailabilitySlotGenerator.OccupiedInterval(LocalTime.of(11, 0), LocalTime.of(11, 30))
        );

        List<LocalTime> slots = AvailabilitySlotGenerator.generateAvailableSlots(
                today,
                occupied,
                30,
                now
        );

        assertFalse(slots.contains(LocalTime.of(9, 0)));
        assertFalse(slots.contains(LocalTime.of(10, 0)));
        assertFalse(slots.contains(LocalTime.of(11, 0)));
        assertTrue(slots.contains(LocalTime.of(10, 30)));
        assertTrue(slots.contains(LocalTime.of(11, 30)));
    }

    @Test
    void shouldBlockSlotsThatOverlapLongerService() {
        LocalDate date = LocalDate.of(2026, 7, 20);
        LocalDateTime now = LocalDateTime.of(2026, 7, 16, 12, 0);
        List<AvailabilitySlotGenerator.OccupiedInterval> occupied = List.of(
                new AvailabilitySlotGenerator.OccupiedInterval(LocalTime.of(10, 0), LocalTime.of(10, 50))
        );

        List<LocalTime> slots = AvailabilitySlotGenerator.generateAvailableSlots(
                date,
                occupied,
                30,
                now
        );

        assertFalse(slots.contains(LocalTime.of(10, 0)));
        assertFalse(slots.contains(LocalTime.of(10, 30)));
        assertTrue(slots.contains(LocalTime.of(11, 0)));
    }

    @Test
    void shouldRespectDurationNearClosingTime() {
        LocalDate date = LocalDate.of(2026, 7, 20);
        LocalDateTime now = LocalDateTime.of(2026, 7, 16, 12, 0);

        List<LocalTime> slots50 = AvailabilitySlotGenerator.generateAvailableSlots(
                date,
                List.of(),
                50,
                now
        );

        assertFalse(slots50.contains(LocalTime.of(17, 30)));
        assertTrue(slots50.contains(LocalTime.of(17, 0)));
    }

    @Test
    void shouldValidateBusinessHourSlots() {
        assertTrue(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(9, 0)));
        assertTrue(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(17, 30)));
        assertFalse(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(8, 30)));
        assertFalse(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(18, 0)));
        assertFalse(AvailabilitySlotGenerator.isWithinBusinessHours(LocalTime.of(10, 15)));
        assertTrue(AvailabilitySlotGenerator.fitsInBusinessHours(LocalTime.of(17, 0), 50));
        assertFalse(AvailabilitySlotGenerator.fitsInBusinessHours(LocalTime.of(17, 30), 50));
    }

    @Test
    void shouldReturnFullDayWhenFutureDateHasNoOccupationFor30Min() {
        LocalDate futureDate = LocalDate.of(2026, 7, 20);
        LocalDateTime now = LocalDateTime.of(2026, 7, 16, 12, 0);

        List<LocalTime> slots = AvailabilitySlotGenerator.generateAvailableSlots(
                futureDate,
                List.of(),
                30,
                now
        );

        assertEquals(LocalTime.of(9, 0), slots.getFirst());
        assertEquals(LocalTime.of(17, 30), slots.getLast());
        assertEquals(18, slots.size());
    }
}
