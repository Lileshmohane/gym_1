package com.gymsaas.platform.common;

// Thrown whenever a request resolves to a resource outside the caller's own
// gymId. This is the exception the cross-tenant isolation test suite
// (Technical Architecture Document, Section 4.1) asserts on for every
// tenant-owned endpoint. Mapped to 404, not 403 — we don't want to confirm
// to an attacker that a resource with that ID exists in a *different* tenant.
public class CrossTenantAccessException extends RuntimeException {
    public CrossTenantAccessException(String message) {
        super(message);
    }
}
