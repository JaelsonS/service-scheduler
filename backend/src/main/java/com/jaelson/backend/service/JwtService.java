package com.jaelson.backend.service;

import com.jaelson.backend.config.JwtProperties;
import com.jaelson.backend.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Emite e valida JWT (access + refresh).
 * A denylist de refresh fica em memória — ok numa instância do Render;
 * se escalar horizontalmente, isso precisa ir pra Redis/banco.
 */
@Service
public class JwtService {

    public static final String TOKEN_TYPE_CLAIM = "type";
    public static final String ROLE_CLAIM = "role";
    public static final String ACCESS_TOKEN_TYPE = "ACCESS";
    public static final String REFRESH_TOKEN_TYPE = "REFRESH";

    private final JwtProperties properties;
    private final Clock clock;
    private final SecretKey signingKey;
    private final Set<String> revokedRefreshTokens = ConcurrentHashMap.newKeySet();

    public JwtService(JwtProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        this.signingKey = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(String email, UserRole role) {
        return createToken(email, role, ACCESS_TOKEN_TYPE, properties.accessTokenExpirationMinutes(), ChronoUnit.MINUTES);
    }

    public String createRefreshToken(String email, UserRole role) {
        return createToken(email, role, REFRESH_TOKEN_TYPE, properties.refreshTokenExpirationDays(), ChronoUnit.DAYS);
    }

    public Claims parseAccessToken(String token) {
        return parseToken(token, ACCESS_TOKEN_TYPE);
    }

    public Claims parseRefreshToken(String token) {
        if (revokedRefreshTokens.contains(token)) {
            throw new JwtException("Token de renovação já foi invalidado");
        }
        return parseToken(token, REFRESH_TOKEN_TYPE);
    }

    public UserRole extractRole(Claims claims) {
        String role = claims.get(ROLE_CLAIM, String.class);
        if (role == null || role.isBlank()) {
            throw new JwtException("Token sem perfil de acesso");
        }
        try {
            return UserRole.valueOf(role);
        } catch (IllegalArgumentException exception) {
            throw new JwtException("Perfil de acesso inválido no token");
        }
    }

    public void revokeRefreshToken(String token) {
        if (token != null && !token.isBlank()) {
            revokedRefreshTokens.add(token);
        }
    }

    public long getAccessTokenExpirationSeconds() {
        return properties.accessTokenExpirationMinutes() * 60;
    }

    private String createToken(
            String email,
            UserRole role,
            String tokenType,
            long expirationAmount,
            ChronoUnit unit
    ) {
        Instant issuedAt = clock.instant();
        Instant expiresAt = issuedAt.plus(expirationAmount, unit);

        return Jwts.builder()
                .subject(email)
                .claim(TOKEN_TYPE_CLAIM, tokenType)
                .claim(ROLE_CLAIM, role.name())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    private Claims parseToken(String token, String expectedType) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .clock(() -> Date.from(clock.instant()))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (!expectedType.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))) {
            throw new JwtException("Tipo de token inesperado");
        }

        return claims;
    }
}
