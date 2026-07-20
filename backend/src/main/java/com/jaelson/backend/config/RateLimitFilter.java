package com.jaelson.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting simples por IP + janela fixa de 60s.
 *
 * Decisão consciente: não puxei Bucket4j/Redis neste MVP. Em produção com
 * múltiplas instâncias isso precisaria de store distribuído — aqui o Render
 * tem uma réplica, então ConcurrentHashMap basta e evita dependência extra.
 *
 * Registrado via {@link RateLimitConfig} (não é @Component) para não poluir
 * slices de @WebMvcTest.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;

    private final RateLimitProperties properties;
    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitProperties properties) {
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!properties.enabled()) {
            return true;
        }
        String path = request.getRequestURI();
        // Health e docs não entram no orçamento — o Render/probes batem o health com frequência.
        return path.startsWith("/actuator/")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String clientKey = resolveClientKey(request);
        int limit = resolveLimit(request.getRequestURI());
        String bucketKey = clientKey + "|" + bucketFor(request.getRequestURI());

        WindowCounter counter = counters.compute(bucketKey, (key, existing) -> {
            long now = Instant.now().toEpochMilli();
            if (existing == null || now - existing.windowStartMillis() >= WINDOW_MILLIS) {
                return new WindowCounter(now, new AtomicInteger(1));
            }
            existing.count().incrementAndGet();
            return existing;
        });

        if (counter.count().get() > limit) {
            writeTooManyRequests(response, limit);
            return;
        }

        // Limpeza ocasional para não crescer sem limite em demos longas.
        if (counters.size() > 5_000) {
            long cutoff = Instant.now().toEpochMilli() - WINDOW_MILLIS;
            counters.entrySet().removeIf(entry -> entry.getValue().windowStartMillis() < cutoff);
        }

        filterChain.doFilter(request, response);
    }

    private int resolveLimit(String path) {
        if (path.startsWith("/api/v1/auth") || path.startsWith("/api/v1/client/auth")) {
            return properties.authRequestsPerMinute();
        }
        if (path.startsWith("/api/v1/appointments") && !path.contains("/availability")) {
            return properties.appointmentRequestsPerMinute();
        }
        return properties.defaultRequestsPerMinute();
    }

    private String bucketFor(String path) {
        if (path.startsWith("/api/v1/auth") || path.startsWith("/api/v1/client/auth")) {
            return "auth";
        }
        if (path.startsWith("/api/v1/appointments") && !path.contains("/availability")) {
            return "appointments";
        }
        return "default";
    }

    private String resolveClientKey(HttpServletRequest request) {
        // Render/Vercel passam o IP real em X-Forwarded-For; o primeiro valor é o cliente.
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }

    private void writeTooManyRequests(HttpServletResponse response, int limit) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", "60");
        response.getWriter().write("""
                {"status":429,"code":"RATE_LIMIT_EXCEEDED","message":"Muitas tentativas. Limite de %d por minuto. Aguarde cerca de 60 segundos."}
                """.formatted(limit).trim());
    }

    private record WindowCounter(long windowStartMillis, AtomicInteger count) {
    }
}
