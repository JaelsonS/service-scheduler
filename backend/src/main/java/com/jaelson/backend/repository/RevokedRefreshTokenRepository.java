package com.jaelson.backend.repository;

import com.jaelson.backend.entity.RevokedRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface RevokedRefreshTokenRepository extends JpaRepository<RevokedRefreshToken, String> {

    boolean existsByTokenHashAndExpiresAtAfter(String tokenHash, Instant now);

    @Modifying
    @Query("DELETE FROM RevokedRefreshToken t WHERE t.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
