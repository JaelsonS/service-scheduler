package com.jaelson.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Limites de taxa por IP. Mantive valores conservadores no default porque
 * o endpoint de login e o de criação de agendamento são os alvos mais óbvios
 * de abuso em um MVP público — e o Render roda em instância única, então
 * um contador em memória já resolve sem Redis.
 */
@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
        boolean enabled,
        int authRequestsPerMinute,
        int appointmentRequestsPerMinute,
        int defaultRequestsPerMinute
) {
}
