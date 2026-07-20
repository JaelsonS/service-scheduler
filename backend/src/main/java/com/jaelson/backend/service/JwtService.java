package com.jaelson.backend.service;

import com.jaelson.backend.config.JwtProperties;
import com.jaelson.backend.entity.RevokedRefreshToken;
import com.jaelson.backend.enums.UserRole;
import com.jaelson.backend.repository.RevokedRefreshTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HexFormat;

/**
 * Emite e valida JWT (access + refresh).
 * Refresh revogado fica no Postgres (hash SHA-256) — sobrevive a restart do Render.
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
    private final RevokedRefreshTokenRepository revokedRefreshTokenRepository;

    public JwtService(
            JwtProperties properties,
            Clock clock,
            RevokedRefreshTokenRepository revokedRefreshTokenRepository
    ) {
        this.properties = properties;
        this.clock = clock;
        this.signingKey = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.revokedRefreshTokenRepository = revokedRefreshTokenRepository;
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
        Instant now = clock.instant();
        if (revokedRefreshTokenRepository.existsByTokenHashAndExpiresAtAfter(sha256(token), now)) {
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

    /**
     * Logout é idempotente: revogar o mesmo refresh duas vezes não deve falhar.
     */
    @Transactional
    public void revokeRefreshToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        Instant expiresAt = clock.instant().plus(properties.refreshTokenExpirationDays(), ChronoUnit.DAYS);
        try {
            Claims claims = parseToken(token, REFRESH_TOKEN_TYPE);
            if (claims.getExpiration() != null) {
                expiresAt = claims.getExpiration().toInstant();
            }
        } catch (JwtException ignored) {
            // Mesmo inválido, registro o hash para não reaproveitar o valor.
        }

        String hash = sha256(token);
        if (revokedRefreshTokenRepository.existsById(hash)) {
            return;
        }

        RevokedRefreshToken revoked = new RevokedRefreshToken();
        revoked.setTokenHash(hash);
        revoked.setExpiresAt(expiresAt);
        revoked.setRevokedAt(clock.instant());

        try {
            revokedRefreshTokenRepository.save(revoked);
        } catch (DataIntegrityViolationException ignored) {
            // Corrida: outro request já inseriu o mesmo hash — logout ok.
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

    static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível", exception);
        }
    }
}
