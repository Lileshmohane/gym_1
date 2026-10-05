package com.gymsaas.platform.common;

import com.gymsaas.platform.auth.PasswordResetService;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(404, "NOT_FOUND", ex.getMessage()));
    }

    // Cross-tenant attempts are deliberately indistinguishable from "not found"
    // in the response body — see CrossTenantAccessException's javadoc.
    @ExceptionHandler(CrossTenantAccessException.class)
    public ResponseEntity<ApiError> handleCrossTenant(CrossTenantAccessException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(404, "NOT_FOUND", "Resource not found."));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.of(401, "UNAUTHORIZED", "Invalid email or password."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.of(403, "FORBIDDEN", "You do not have permission to perform this action."));
    }

    // Correct password but the account is not usable yet (pending approval /
    // rejected / disabled). 403 with the specific reason so the login screen can
    // show it; deliberately NOT 401 so it doesn't look like wrong credentials.
    @ExceptionHandler(AccountNotActiveException.class)
    public ResponseEntity<ApiError> handleAccountNotActive(AccountNotActiveException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.of(403, "ACCOUNT_NOT_ACTIVE", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of(400, "VALIDATION_ERROR", "Request validation failed.", details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of(400, "VALIDATION_ERROR", ex.getMessage()));
    }

    // e.g. the (gym_id, email) unique constraint when adding a duplicate member
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of(409, "CONFLICT", "That record conflicts with an existing one (for example, a duplicate email)."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of(400, "BAD_REQUEST", ex.getMessage()));
    }

    // Invalid / expired password-reset OTP (or unknown account on the reset
    // step). 400 rather than 401 so it doesn't trip the mobile app's token
    // refresh-and-retry interceptor, which fires on 401.
    @ExceptionHandler(PasswordResetService.BadOtpException.class)
    public ResponseEntity<ApiError> handleBadOtp(PasswordResetService.BadOtpException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of(400, "BAD_REQUEST", ex.getMessage()));
    }

    // Catch-all: never leak the raw exception message/stack trace to the client.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(500, "INTERNAL_ERROR", "Something went wrong. Please try again."));
    }
}
