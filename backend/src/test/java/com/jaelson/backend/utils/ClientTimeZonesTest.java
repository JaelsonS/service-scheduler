package com.jaelson.backend.utils;

import org.junit.jupiter.api.Test;

import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClientTimeZonesTest {

    @Test
    void shouldUseClientTimezoneWhenValid() {
        ZoneId fallback = ZoneId.of("America/Sao_Paulo");
        assertEquals(ZoneId.of("Europe/Lisbon"), ClientTimeZones.resolve("Europe/Lisbon", fallback));
    }

    @Test
    void shouldFallbackWhenTimezoneMissingOrInvalid() {
        ZoneId fallback = ZoneId.of("America/Sao_Paulo");
        assertEquals(fallback, ClientTimeZones.resolve(null, fallback));
        assertEquals(fallback, ClientTimeZones.resolve(" ", fallback));
        assertEquals(fallback, ClientTimeZones.resolve("Not/AZone", fallback));
    }
}
