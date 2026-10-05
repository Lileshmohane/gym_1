package com.gymsaas.platform.notification;

import com.gymsaas.platform.gym.Gym;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.payment.Payment;
import com.gymsaas.platform.plan.MembershipPlan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);

    private final RestClient restClient;
    private final boolean enabled;
    private final String apiBaseUrl;
    private final String phoneNumberId;
    private final String accessToken;
    private final String receiptTemplate;
    private final String expiryTemplate;
    private final String resetTemplate;
    private final String defaultCountryCode;

    public WhatsAppService(RestClient.Builder builder,
                           @Value("${app.whatsapp.enabled:false}") boolean enabled,
                           @Value("${app.whatsapp.api-base-url:https://graph.facebook.com/v22.0}") String apiBaseUrl,
                           @Value("${app.whatsapp.phone-number-id:}") String phoneNumberId,
                           @Value("${app.whatsapp.access-token:}") String accessToken,
                           @Value("${app.whatsapp.receipt-template:fittrack_payment_receipt}") String receiptTemplate,
                           @Value("${app.whatsapp.expiry-template:fittrack_expiry_3_day}") String expiryTemplate,
                           @Value("${app.whatsapp.reset-template:fittrack_password_reset}") String resetTemplate,
                           @Value("${app.whatsapp.default-country-code:91}") String defaultCountryCode) {
        this.restClient = builder.build();
        this.enabled = enabled;
        this.apiBaseUrl = apiBaseUrl;
        this.phoneNumberId = phoneNumberId;
        this.accessToken = accessToken;
        this.receiptTemplate = receiptTemplate;
        this.expiryTemplate = expiryTemplate;
        this.resetTemplate = resetTemplate;
        this.defaultCountryCode = defaultCountryCode;
    }

    public boolean isEnabled() {
        return enabled && !phoneNumberId.isBlank() && !accessToken.isBlank();
    }

    public boolean sendPaymentReceipt(Payment payment, AppUser member, Gym gym, MembershipPlan plan) {
        return sendTemplate(member.getPhone(), receiptTemplate, List.of(
                gym.getName(), member.getName(), safe(member.getPhone()), plan.getName(),
                payment.getAmount().toPlainString(), payment.getPaymentMethod().name(),
                payment.getPaymentDate().toString(), safe(payment.getReference())
        ));
    }

    public boolean sendExpiryReminder(AppUser member, Gym gym, MembershipPlan plan, LocalDate expiryDate) {
        return sendTemplate(member.getPhone(), expiryTemplate, List.of(
                gym.getName(), member.getName(), plan.getName(), expiryDate.toString()
        ));
    }

    /**
     * Sends a password-reset one-time password. Unlike the receipt/reminder
     * templates this is a fixed single-parameter "your code is {{1}}" template.
     */
    public boolean sendPasswordResetOtp(AppUser user, String otp) {
        return sendTemplate(user.getPhone(), resetTemplate, List.of(otp));
    }

    public String normalizePhoneForDisplay(String phone) {
        return normalizePhone(phone);
    }

    private boolean sendTemplate(String phone, String template, List<String> values) {
        if (!isEnabled()) {
            log.info("WhatsApp is disabled or not configured; skipped template {}", template);
            return false;
        }
        String recipient = normalizePhone(phone);
        if (recipient == null) {
            log.warn("WhatsApp delivery skipped because the recipient phone number is missing or invalid");
            return false;
        }
        List<Map<String, String>> parameters = values.stream()
                .map(value -> Map.of("type", "text", "text", safe(value)))
                .toList();
        Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", recipient,
                "type", "template",
                "template", Map.of(
                        "name", template,
                        "language", Map.of("code", "en"),
                        "components", List.of(Map.of("type", "body", "parameters", parameters))
                )
        );
        try {
            restClient.post()
                    .uri(apiBaseUrl + "/" + phoneNumberId + "/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException exception) {
            log.warn("WhatsApp template {} delivery failed: {}", template, exception.getMessage());
            return false;
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 10 && !defaultCountryCode.isBlank()) digits = defaultCountryCode + digits;
        return digits.length() >= 11 && digits.length() <= 15 ? digits : null;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}