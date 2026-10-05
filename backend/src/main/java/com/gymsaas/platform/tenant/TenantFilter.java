package com.gymsaas.platform.tenant;

import com.gymsaas.platform.security.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Runs immediately AFTER JwtAuthenticationFilter in the security chain (see
 * SecurityConfig). Reads gymId off the already-authenticated principal —
 * never off a request body/path parameter (Technical Architecture Document,
 * Section 4.1) — and stores it in {@link TenantContext}.
 *
 * It deliberately does NOT enable the Hibernate filter itself: at servlet-filter
 * time no persistence context is bound to the request yet, so a filter enabled
 * here would be applied to a throwaway session and silently lost. The actual
 * enabling happens in {@link TenantFilterAspect}, inside the session that
 * really runs the query.
 */
@Component
@Order(2)
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        try {
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails principal) {
                TenantContext.setPlatformAdmin(principal.isPlatformAdmin());
                if (!principal.isPlatformAdmin()) {
                    TenantContext.setGymId(principal.getGymId());
                }
            }
            chain.doFilter(request, response);
        } finally {
            // Pooled request threads MUST NOT carry tenant state into the next request.
            TenantContext.clear();
        }
    }
}
