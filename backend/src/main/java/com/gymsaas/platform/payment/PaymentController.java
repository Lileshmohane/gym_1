package com.gymsaas.platform.payment;

import com.gymsaas.platform.security.CustomUserDetails;
import com.gymsaas.platform.subscription.SubscriptionDtos.PaymentResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<PaymentResponse> mine(@AuthenticationPrincipal CustomUserDetails principal) {
        return paymentService.mine(principal.getUserId());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    public List<PaymentResponse> pending() {
        return paymentService.pendingForGym();
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    public PaymentResponse confirm(@PathVariable Long id) {
        return paymentService.confirm(id);
    }
}