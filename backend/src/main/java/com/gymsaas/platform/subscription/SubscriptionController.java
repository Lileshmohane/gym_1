package com.gymsaas.platform.subscription;

import com.gymsaas.platform.security.CustomUserDetails;
import com.gymsaas.platform.subscription.SubscriptionDtos.EnrollInPlanRequest;
import com.gymsaas.platform.subscription.SubscriptionDtos.EnrollmentResponse;
import com.gymsaas.platform.subscription.SubscriptionDtos.ManagedSubscriptionResponse;
import com.gymsaas.platform.subscription.SubscriptionDtos.SubscriptionResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public EnrollmentResponse enroll(@AuthenticationPrincipal CustomUserDetails principal,
                                     @Valid @RequestBody EnrollInPlanRequest request) {
        return subscriptionService.enroll(principal.getUserId(), request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public SubscriptionResponse mine(@AuthenticationPrincipal CustomUserDetails principal) {
        return subscriptionService.getMine(principal.getUserId());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    public List<ManagedSubscriptionResponse> listForGym() {
        return subscriptionService.listForGym();
    }
}