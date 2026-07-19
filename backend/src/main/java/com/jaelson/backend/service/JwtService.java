package com.jaelson.backend.service;

import com.jaelson.backend.config.JwtProperties;
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

@Service
public class JwtService {

    public static final String TOKEN_TYPE_CLAIM = "type";
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

    public String createAccessToken(String email) {
        return createToken(email, ACCESS_TOKEN_TYPE, properties.accessTokenExpirationMinutes(), ChronoUnit.MINUTES);
    }

    public String createRefreshToken(String email) {
        return createToken(email, REFRESH_TOKEN_TYPE, properties.refreshTokenExpirationDays(), ChronoUnit.DAYS);
    }

    public Claims parseAccessToken(String token) {
        return parseToken(token, ACCESS_TOKEN_TYPE);
    }

    public Claims parseRefreshToken(String token) {
        if (revokedRefreshTokens.contains(token)) {
            throw new JwtException("Refresh token has been revoked");
        }
        return parseToken(token, REFRESH_TOKEN_TYPE);
    }

    public void revokeRefreshToken(String token) {
        if (token != null && !token.isBlank()) {
            revokedRefreshTokens.add(token);
        }
    }

    public long getAccessTokenExpirationSeconds() {
        return properties.accessTokenExpirationMinutes() * 60;
    }

    private String createToken(String email, String tokenType, long expirationAmount, ChronoUnit unit) {
        Instant issuedAt = clock.instant();
        Instant expiresAt = issuedAt.plus(expirationAmount, unit);

        return Jwts.builder()
                .subject(email)
                .claim(TOKEN_TYPE_CLAIM, tokenType)
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
            throw new JwtException("Unexpected token type");
        }

        return claims;
    }
}
