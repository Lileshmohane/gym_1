package com.gymsaas.platform.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymsaas.platform.billing.PlatformAdminService;
import com.gymsaas.platform.gym.GymRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.mock.web.MockMultipartFile;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

/**
 * The cross-tenant isolation suite the Technical Architecture Document
 * (Section 4.1) calls a RELEASE GATE, not optional coverage. Two real gyms
 * are registered through the public API; gym B then tries to read/modify
 * gym A's data through every tenant-owned endpoint and must always get a 404
 * (never A's data, and never a 403 that would confirm the id exists).
 *
 * Runs against a real PostgreSQL container (requires Docker), not H2, because the
 * migrations and constraints are PostgreSQL-specific.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class CrossTenantIsolationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired GymRepository gymRepository;
    @Autowired PlatformAdminService platformAdminService;

    static String tokenA;
    static String tokenB;
    static long memberOfA;
    static long planOfA;

    // Self-registration no longer returns tokens (the admin starts PENDING), so
    // this mirrors the real flow: register, have the super admin approve it, then
    // log in to obtain the owner's access token used by the isolation checks.
    private String register(String gym, String email) throws Exception {
        String body = """
            {"gymName":"%s","gymPhone":"9999999999","ownerEmail":"%s","password":"password123","ownerName":"Owner %s"}
            """.formatted(gym, email, gym);
        mvc.perform(post("/api/v1/auth/register-gym").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());

        long gymId = gymRepository.findByEmail(email)
                .orElseThrow(() -> new AssertionError("gym not created for " + email)).getId();
        platformAdminService.approveRegistration(gymId);

        MvcResult login = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private void seed() throws Exception {
        if (tokenA != null) return;
        tokenA = register("Gym A", "owner-a@example.com");
        tokenB = register("Gym B", "owner-b@example.com");

        MvcResult m = mvc.perform(post("/api/v1/members").header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"phone\":\"111\"}"))
                .andExpect(status().isCreated()).andReturn();
        memberOfA = json.readTree(m.getResponse().getContentAsString()).get("member").get("id").asLong();

        MvcResult p = mvc.perform(post("/api/v1/plans").header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Monthly\",\"durationDays\":30,\"price\":999}"))
                .andExpect(status().isCreated()).andReturn();
        planOfA = json.readTree(p.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void ownerCanReadOwnMember() throws Exception {
        seed();
        mvc.perform(get("/api/v1/members/" + memberOfA).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    void memberPhotoIsAvailableOnlyToItsGym() throws Exception {
        seed();
        byte[] photoBytes = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9};
        MockMultipartFile photo = new MockMultipartFile("photo", "member.jpg", "image/jpeg", photoBytes);

        MvcResult created = mvc.perform(multipart("/api/v1/members")
                        .file(photo)
                        .param("name", "Photo Member")
                        .param("email", "photo-member@example.com")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.member.hasPhoto").value(true))
                .andReturn();
        long photoMemberId = json.readTree(created.getResponse().getContentAsString())
                .get("member").get("id").asLong();

        mvc.perform(get("/api/v1/members/" + photoMemberId + "/photo")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"))
                .andExpect(content().bytes(photoBytes));

        mvc.perform(get("/api/v1/members/" + photoMemberId + "/photo")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherGymCannotReadMember() throws Exception {
        seed();
        mvc.perform(get("/api/v1/members/" + memberOfA).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherGymCannotUpdateMember() throws Exception {
        seed();
        mvc.perform(put("/api/v1/members/" + memberOfA).header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Hacked\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherGymCannotMarkMemberAsLeftOrEraseData() throws Exception {
        seed();
        mvc.perform(put("/api/v1/members/" + memberOfA + "/status").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/members/" + memberOfA + "/erase-data").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherGymMemberListIsEmpty() throws Exception {
        seed();
        mvc.perform(get("/api/v1/members").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void otherGymCannotSeeOrUsePlan() throws Exception {
        seed();
        mvc.perform(get("/api/v1/plans").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void otherGymCannotAssignSubscriptionUsingForeignMemberOrPlan() throws Exception {
        seed();
        mvc.perform(post("/api/v1/subscriptions").header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"memberId\":" + memberOfA + ",\"planId\":" + planOfA + "}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherGymCannotRecordPaymentForForeignMember() throws Exception {
        seed();
        mvc.perform(post("/api/v1/payments").header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"memberId\":" + memberOfA + ",\"amount\":999}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherGymCannotCheckForeignMemberIn() throws Exception {
        seed();
        mvc.perform(post("/api/v1/attendance/check-in").header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"source\":\"STAFF_MANUAL\",\"memberId\":" + memberOfA + "}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void dashboardOnlyCountsOwnGym() throws Exception {
        seed();
        mvc.perform(get("/api/v1/dashboard").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activeMembers").value(1));
        mvc.perform(get("/api/v1/dashboard").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activeMembers").value(0));
    }

    @Test
    void unauthenticatedRequestGets401() throws Exception {
        mvc.perform(get("/api/v1/members")).andExpect(status().isUnauthorized());
    }

    @Test
    void memberRoleCannotCallOwnerEndpoints() throws Exception {
        seed();
        // Log in as Alice with the temporary password returned at creation.
        MvcResult created = mvc.perform(post("/api/v1/members").header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Bob\",\"email\":\"bob@example.com\"}"))
                .andExpect(status().isCreated()).andReturn();
        String temp = json.readTree(created.getResponse().getContentAsString()).get("temporaryPassword").asText();
        MvcResult login = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"bob@example.com\",\"password\":\"" + temp + "\"}"))
                .andExpect(status().isOk()).andReturn();
        String memberToken = json.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        mvc.perform(get("/api/v1/members").header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginAccountTypeDisambiguatesAdminAndMemberAccounts() throws Exception {
        seed();
        MvcResult created = mvc.perform(post("/api/v1/members").header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Gym B Member\",\"email\":\"owner-a@example.com\"}"))
                .andExpect(status().isCreated()).andReturn();
        String temporaryPassword = json.readTree(created.getResponse().getContentAsString())
                .get("temporaryPassword").asText();

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner-a@example.com\",\"password\":\"password123\",\"accountType\":\"GYM_ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("GYM_OWNER"));

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner-a@example.com\",\"password\":\"" + temporaryPassword + "\",\"accountType\":\"MEMBER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("MEMBER"));
    }

    @Test
    void memberFillsInOwnProfileAndPhoto() throws Exception {
        seed();
        // Owner creates the account with just the basics — no photo required.
        MvcResult created = mvc.perform(post("/api/v1/members").header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Self Serve\",\"email\":\"self-serve@example.com\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.member.hasPhoto").value(false))
                .andReturn();
        long memberId = json.readTree(created.getResponse().getContentAsString()).get("member").get("id").asLong();
        String temp = json.readTree(created.getResponse().getContentAsString()).get("temporaryPassword").asText();

        // The member signs in with the one-time password and completes their profile.
        MvcResult login = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"self-serve@example.com\",\"password\":\"" + temp + "\",\"accountType\":\"MEMBER\"}"))
                .andExpect(status().isOk()).andReturn();
        String memberToken = json.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();

        mvc.perform(get("/api/v1/members/me").header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Self Serve"))
                .andExpect(jsonPath("$.hasPhoto").value(false));

        mvc.perform(put("/api/v1/members/me").header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Self Serve Updated\",\"phone\":\"222\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Self Serve Updated"))
                .andExpect(jsonPath("$.phone").value("222"));

        byte[] photoBytes = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9};
        MockMultipartFile photo = new MockMultipartFile("photo", "self.jpg", "image/jpeg", photoBytes);
        mvc.perform(multipart("/api/v1/members/me/photo").file(photo)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPhoto").value(true));

        mvc.perform(get("/api/v1/members/me/photo").header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"))
                .andExpect(content().bytes(photoBytes));

        // The self-uploaded photo is what front desk sees in the roster.
        mvc.perform(get("/api/v1/members/" + memberId + "/photo").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(content().bytes(photoBytes));
    }
}
