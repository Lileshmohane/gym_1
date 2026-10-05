package com.gymsaas.platform.tenant;

// Holds the current request's gymId, resolved ONLY from the validated JWT
// (never from a request body/path parameter) — see TenantFilter.
// Technical Architecture Document, Section 4.1: this is the single source of
// truth every repository/service must scope queries against.
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_GYM_ID = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> IS_PLATFORM_ADMIN = ThreadLocal.withInitial(() -> false);

    private TenantContext() {}

    public static void setGymId(Long gymId) {
        CURRENT_GYM_ID.set(gymId);
    }

    public static Long getGymId() {
        return CURRENT_GYM_ID.get();
    }

    public static void setPlatformAdmin(boolean isAdmin) {
        IS_PLATFORM_ADMIN.set(isAdmin);
    }

    public static boolean isPlatformAdmin() {
        return Boolean.TRUE.equals(IS_PLATFORM_ADMIN.get());
    }

    // MUST be called at the end of every request (see TenantFilter's finally
    // block) — ThreadLocals leak across requests on pooled threads otherwise,
    // which would be a tenant-isolation bug in its own right.
    public static void clear() {
        CURRENT_GYM_ID.remove();
        IS_PLATFORM_ADMIN.remove();
    }
}
