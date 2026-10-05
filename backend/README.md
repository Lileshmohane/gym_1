# FitTrack — Backend (Spring Boot 3 / Java 17 / PostgreSQL 16)

Implements the **Technical Architecture Document** and **Database Schema Design Document**
as a modular monolith, and exposes exactly the `/api/v1` contract the React Native app
(`FitTrack_Mobile_App_Source.zip`) already calls.

## Run it

```bash
# 1. Build the jar (needs JDK 17 + Maven, or use the wrapper if you add one)
mvn -DskipTests package

# 2. Start PostgreSQL + the API (DB password defaults to NewPassword123)
export JWT_SECRET='replace-with-at-least-32-random-characters'
docker compose up --build
# API on http://localhost:8080 — health: GET /actuator/health
```

Flyway creates the schema on first boot (`src/main/resources/db/migration`, V1–V7).
Hibernate is set to `validate` only — it never alters the schema.

Point the mobile app at it with `EXPO_PUBLIC_API_URL=http://<your-machine-LAN-ip>:8080`
(a phone can't reach `localhost` on your computer).

## Endpoints

| Method & path | Who | Notes |
|---|---|---|
| POST `/auth/register-gym` | public | creates gym (PENDING) + owner (INACTIVE); no tokens — a super admin must approve it first |
| POST `/auth/login`, `/auth/refresh` | public | login accepts optional `accountType`: `GYM_ADMIN` or `MEMBER`; 15-min access / 14-day refresh JWT |
| GET `/gym/profile` | owner, staff | |
| POST/GET `/members`, GET/PUT `/members/{id}` | owner, staff | creation takes name, email, phone (multipart also accepts an optional JPEG/PNG/WebP photo up to 2 MB) — the member fills in their own profile + photo later |
| GET/PUT `/members/me`, GET/POST/DELETE `/members/me/photo` | member | self-service profile: view/edit own name+phone, view/upload/replace/remove own photo (member id is taken from the JWT) |
| GET `/members/{id}/photo` | owner, staff | authenticated, gym-scoped photo response (lets front desk verify the member's self-uploaded photo) |
| PUT `/members/{id}/status` | owner | "Mark as Left": deactivate, cancel sub, drop push tokens |
| POST `/members/{id}/erase-data` | owner | anonymize; keeps payment/attendance rows |
| POST/GET `/plans` | owner create, all read | |
| GET `/dashboard` | owner, staff | live counts + month revenue + active/expiring/expired member lists |
| POST `/subscriptions/me`, GET `/subscriptions/me` | member | enroll in a plan (creates pending payment); view own membership (includes `gymName`) |
| GET `/subscriptions` | owner, staff | all memberships with computed ACTIVE/EXPIRING/EXPIRED status |
| GET `/payments/me`, GET `/payments/pending`, POST `/payments/{id}/confirm` | member / owner,staff | confirm triggers the WhatsApp receipt |
| POST `/attendance/check-in`, POST `/attendance/{id}/check-out`, GET `/attendance/me` | member | self-service punch in/out |
| GET `/attendance/today` | owner, staff | today's visits |
| GET `/admin/gyms`, POST `/admin/gyms`, PUT `/admin/gyms/{id}`, DELETE `/admin/gyms/{id}`, PUT `/admin/gyms/{id}/status`, PUT `/admin/gyms/{id}/fee`, POST `/admin/gyms/{id}/charge`, GET `/admin/registrations`, POST `/admin/registrations/{id}/approve`, POST `/admin/registrations/{id}/reject`, GET `/admin/dashboard` | super admin | manage gyms and their individually configurable monthly platform fees |

(All under `/api/v1`.)

## How tenant isolation works

1. `JwtAuthenticationFilter` builds the principal from the signed token (no DB hit).
2. `TenantFilter` copies `gymId` into `TenantContext` — never from a request body/path.
3. `TenantFilterAspect` enables Hibernate's `tenantFilter` before every repository call, so
   queries on tenant-owned entities get `AND gym_id = :gymId` automatically.
4. Services also use explicit `findByIdAndGymId(...)` (Hibernate filters do **not** apply to
   lookups by primary key — that's why bare `findById` is avoided for tenant-owned rows).
5. `CrossTenantIsolationTest` registers two gyms and asserts gym B always gets 404 on gym A's
   data across every endpoint. Treat it as a release gate.

## Tests

`mvn test` runs against a real PostgreSQL database via Testcontainers, so **Docker must be running**.

## Reminders & push notifications

`ReminderScheduler` runs daily at 09:00 (server time; override with `app.reminder.cron`) and
sends: 3 days before expiry, on the expiry day, and the day after. A unique
`(subscription_id, reminder_type)` constraint prevents duplicate sends.

Pushes are **off by default** (`NOTIFICATIONS_ENABLED=false` → log-only dry run). Set it to
`true` to send for real. The app registers **Expo** push tokens (`ExponentPushToken[...]`),
which are *not* FCM tokens, so `NotificationService` routes by token format: Expo tokens go to
Expo's push service (works with Expo Go / EAS builds, no Firebase needed); anything else goes
through the Firebase Admin SDK if `FCM_SERVICE_ACCOUNT_JSON_PATH` is set.

A reminder with no registered device is recorded as `FAILED` (visible), not silently `SENT`.

## Status: what has and hasn't been verified

**Not compiled or run.** The environment this was written in has no Maven Central access and no
`javac`, so I could not build it or run the tests. What *was* checked: every one of the 38 Java
files parses with a Java grammar parser (0 syntax errors), and a script confirmed no project
class is used without an import. Expect to fix a few compile/type errors on the first
`mvn package` — run `mvn test` before trusting the isolation guarantees.

## Deviations from the schema document (update the doc or the migrations)

- Enum columns are `VARCHAR` + `CHECK` constraints, not MySQL `ENUM` (Hibernate maps enums to
  varchar; ENUM columns risk schema-validation mismatches).
- IDs are plain `BIGINT`, not `BIGINT UNSIGNED`, for the same reason.
- Every table has `created_at` and `updated_at` (from `BaseEntity`), a superset of the doc.
- `audit_log` exists as a table but has no entity or writer yet.

## Known gaps

- **No invite / password-reset flow.** Creating a member returns a one-time temporary
  password for staff to hand over. Replace with an email/SMS invite before real onboarding.
- **Super admin.** The single super admin is provisioned backend-side on first boot by
  `PlatformAdminBootstrap` from `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` / `PLATFORM_ADMIN_NAME`.
  It exercises `/api/v1/admin/**` (secured to `PLATFORM_ADMIN`) to create gym admins and charge them a
  monthly platform fee (default `app.billing.monthly-fee`, configurable per gym). A scheduled convenience job to auto-expire
  unpaid gym fees (or send them a WhatsApp reminder like member expiries) is not yet added — status is computed
  on read and renewed manually via `POST /admin/gyms/{id}/charge`.
- **No notification-preferences endpoint** (`PUT /notifications/preferences`), so the app's
  per-type toggles are still local-only.
- **No rate limiting** on `/auth/**` (the security section of the architecture doc asks for it).
- **Run one scheduler instance.** The unique constraint stops duplicate *rows*, but two
  instances racing would make one throw; add ShedLock before scaling out.
- Login disambiguates same-email accounts across gyms by password match; two accounts with the
  same email *and* password in different gyms would resolve to whichever is found first.
- CORS allows `localhost` and `*.yourapp.com` — set your real origins.
