package com.gymsaas.platform.config;

import com.gymsaas.platform.security.JwtAuthenticationFilter;
import com.gymsaas.platform.tenant.TenantFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Boot auto-registers every Filter @Component as a servlet filter too.
 * These two must run ONLY inside the Spring Security chain (JWT first, then
 * tenant — see SecurityConfig), so the duplicate servlet registrations are off.
 */
@Configuration
public class FilterRegistrationConfig {

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> disableJwtServletRegistration(JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public FilterRegistrationBean<TenantFilter> disableTenantServletRegistration(TenantFilter filter) {
        FilterRegistrationBean<TenantFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }
}
