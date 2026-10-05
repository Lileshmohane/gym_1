package com.gymsaas.platform.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

/**
 * Issues and validates access/refresh JWTs. Claims always include gymId and
 * role (Technical Architecture Document, Section 8) — TenantFilter reads
 * these indirectly via CustomUserDetails after JwtAuthenticationFilter
 * resolves the token back to a full AppUser.
 *
 * Tokens are short-lived on purpose (default 15 min access / 14 day refresh,
 * see application.yml) — the mobile app's axios interceptor (see the RN
 * source, src/api/client.ts) refreshes automatically on 401.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTtlMinutes;
    private final long refreshTtlDays;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-ttl-minutes}") long accessTtlMinutes,
            @Value("${app.jwt.refresh-ttl-days}") long refreshTtlDays
    ) {
        // NOTE: production secrets must be at least 256 bits (32 bytes) for HS256.
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTtlMinutes = accessTtlMinutes;
        this.refreshTtlDays = refreshTtlDays;
    }

    public String generateAccessToken(Long userId, Long gymId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("gymId", gymId)
                .claim("role", role)
                .claim("type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTtlMinutes * 60)))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(refreshTtlDays * 24 * 3600)))
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(parseClaims(token).get("type", String.class));
    }

    /** Returns true only if the token parses, is unexpired, and is signature-valid. */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
