package com.gymsaas.platform.security;

import com.gymsaas.platform.member.Role;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Validates the Authorization: Bearer <token> header and populates the
 * SecurityContext directly from the token's claims — see CustomUserDetails
 * for why this doesn't hit the database per request.
 *
 * Runs first in the security filter chain (@Order(1)); TenantFilter
 * (@Order(2)) runs immediately after and depends on this filter having
 * already set the Authentication.
 */
@Component
@Order(1)
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtService.isValid(token)) {
                Claims claims = jwtService.parseClaims(token);
                String type = claims.get("type", String.class);

                // Only access tokens authenticate API requests — a refresh
                // token is only ever accepted by POST /auth/refresh, which
                // reads it from the request body, not this header.
                if ("access".equals(type)) {
                    Long userId = Long.valueOf(claims.getSubject());
                    // Read as Number: small JSON integers decode as Integer, so asking for
                    // Long directly is fragile. PLATFORM_ADMIN tokens carry no gymId (null).
                    Number gymClaim = claims.get("gymId", Number.class);
                    Long gymId = gymClaim == null ? null : gymClaim.longValue();
                    Role role = Role.valueOf(claims.get("role", String.class));

                    CustomUserDetails principal = CustomUserDetails.fromClaims(userId, gymId, role);
                    var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
            // An invalid/expired token is simply not authenticated — Spring
            // Security's entry point returns 401 for the protected endpoints
            // that require it, rather than this filter rejecting the request
            // itself (a request to a public endpoint with a stale token should
            // still succeed).
        }

        filterChain.doFilter(request, response);
    }
}
