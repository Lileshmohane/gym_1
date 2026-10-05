package com.gymsaas.platform.common;

import java.time.Instant;
import java.util.List;

// Consistent error body across every endpoint — never leaks stack traces or
// internal exception messages (Technical Architecture Document, Section 8).
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        List<String> details
) {
    public static ApiError of(int status, String error, String message) {
        return new ApiError(Instant.now(), status, error, message, List.of());
    }

    public static ApiError of(int status, String error, String message, List<String> details) {
        return new ApiError(Instant.now(), status, error, message, details);
    }
}
