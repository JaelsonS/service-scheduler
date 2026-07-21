package com.jaelson.backend.utils;

import java.time.DateTimeException;
import java.time.ZoneId;

/**
 * Resolve o fuso enviado pelo cliente. Se inválido/ausente, usa o fuso da aplicação.
 */
public final class ClientTimeZones {

    private ClientTimeZones() {
    }

    public static ZoneId resolve(String timezone, ZoneId fallback) {
        if (timezone == null || timezone.isBlank()) {
            return fallback;
        }
        try {
            return ZoneId.of(timezone.trim());
        } catch (DateTimeException ex) {
            return fallback;
        }
    }
}
