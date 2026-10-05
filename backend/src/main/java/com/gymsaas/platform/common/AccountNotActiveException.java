package com.gymsaas.platform.common;

// Thrown at login when the credentials are correct but the account cannot be
// used yet — most commonly a gym admin whose registration is still awaiting
// super-admin approval, or was rejected. Mapped to 403 (not 401) so the mobile
// app's refresh-and-retry interceptor (which fires on 401) is not triggered,
// and the user sees the human-readable reason instead of "invalid credentials".
public class AccountNotActiveException extends RuntimeException {
    public AccountNotActiveException(String message) {
        super(message);
    }
}
