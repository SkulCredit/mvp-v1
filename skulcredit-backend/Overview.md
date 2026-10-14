# SkulCredit Backend — Project Overview

> Prepared: August 2026 | Last Updated: August 2026  
> Scope: Full implementation audit covering tech stack, infrastructure, monitoring, endpoints, models, and remaining work.

---

## 1. What This Project Is

SkulCredit is a Nigerian school-fee financing platform connecting parents, partner schools, and an internal operations/risk team. Three distinct portals:

- **Parent Portal** — register, verify identity, apply for school-fee loans, track status, manage students
- **School Portal** — onboard as partner, view applications, confirm student enrollment, track disbursements
- **Admin Portal** — underwrite loans, manage schools and parents, compliance, analytics

---

## 2. Tech Stack

### Runtime & Framework
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x (LTS) | Runtime |
| Express | 5.2.x | HTTP framework |
| PostgreSQL | 16 | Primary relational database |
| Sequelize | 6.37.x | ORM — UUID PKs, underscored columns, associations |
| Redis (ioredis) | 7 / 5.6.x | OTP store, account lockout, email verification tokens |
| RabbitMQ | 3.13 | Message broker (provisioned, not yet consumed by app) |

### Security & Auth
| Technology | Purpose |
|---|---|
| bcryptjs | Password hashing (cost factor 10) |
| jsonwebtoken | JWT access tokens + DB-backed refresh token rotation |
| helmet | HTTP security headers |
| express-rate-limit | 100 req/15min per IP on all `/api/*` routes |
| uuid | UUID v4 for requestId per request |

### Observability
| Technology | Purpose |
|---|---|
| Winston | Structured JSON logging to stdout + `logs/*.log` files |
| prom-client | Prometheus metrics exposed at `GET /metrics` |
| geoip-lite | Offline IP → country/city/lat-lon geo-resolution |
| ua-parser-js | User-Agent → device type, browser, OS parsing |

### Integrations (partial)
| Technology | Purpose |
|---|---|
| Cloudinary | Document storage (KYB docs, ID uploads) |
| Multer | Multipart file handling before Cloudinary upload |
| Nodemailer | Transactional email (verification, OTP, password reset) |
| Axios | Base HTTP client for Lendsqr/Adjutor API calls |
| Paystack | Payment initialization + verification (partial) |

### API & Docs
| Technology | Purpose |
|---|---|
| Zod | Request body/query/params validation |
| swagger-jsdoc + swagger-ui-express | Auto-generated OpenAPI 3.0 docs |

### Dev & Tooling
| Technology | Purpose |
|---|---|
| dotenv | Environment variable loading |
| nodemon | Dev auto-restart |
| Jest + supertest | Test runner (installed, no tests written yet) |

---

## 3. Infrastructure & Docker

### Services (docker-compose.yml)

| Container | Image | Port(s) | Purpose |
|---|---|---|---|
| `skulcredit_api` | Custom multi-stage Dockerfile | `8080` | Node.js API |
| `skulcredit_postgres` | postgres:16-alpine | `5432` | Primary database |
| `skulcredit_redis` | redis:7-alpine | `6379` | OTP + session store (256MB LRU) |
| `skulcredit_rabbitmq` | rabbitmq:3.13-management-alpine | `5672`, `15672` | Message broker |
| `skulcredit_prometheus` | prom/prometheus:v2.51.2 | `9090` | Metrics scraper (15s interval, 15-day retention) |
| `skulcredit_loki` | grafana/loki:2.9.6 | `3100` | Log aggregation (14-day retention) |
| `skulcredit_promtail` | grafana/promtail:2.9.6 | — | Log collector (Docker socket + file-based) |
| `skulcredit_grafana` | grafana/grafana:10.4.2 | `3000` | Dashboards — auto-provisioned |

### Dockerfile
- Multi-stage build: `deps` (prod-only node_modules) → `dev` (nodemon + source mount) → `prod` (non-root user, healthcheck)
- Switch targets: `BUILD_TARGET=dev docker compose up` for hot-reload dev

### Networks
- `app_net` — API + Postgres + Redis + RabbitMQ
- `monitoring_net` — API + all monitoring services

### Volumes (all named, persistent)
`postgres_data`, `redis_data`, `rabbitmq_data`, `prometheus_data`, `loki_data`, `grafana_data`

---

## 4. Monitoring Stack

### Access URLs

| Service | URL | Credentials |
|---|---|---|
| Grafana Dashboard | `http://localhost:3000` | `admin` / `skulcredit_grafana` |
| Prometheus | `http://localhost:9090` | None |
| RabbitMQ Management | `http://localhost:15672` | `skulcredit` / `skulcredit_pass` |
| Loki (query API) | `http://localhost:3100` | None |
| API Metrics endpoint | `http://localhost:8080/metrics` | None |
| Swagger Docs | `http://localhost:8080/api/v1/docs` | None |
| OpenAPI JSON | `http://localhost:8080/api/v1/docs.json` | None |

### Prometheus (`docker/prometheus/`)
- Scrape interval: **15 seconds** for all targets
- Metric retention: **15 days**
- Targets: `skulcredit_api:8080/metrics`, `rabbitmq:15692/metrics`, `loki:3100`, `localhost:9090`
- **10 alert rules** in `alerts.yml`:
  - API down > 1 min → critical
  - HTTP 5xx error rate > 5% → warning
  - p95 latency > 2s → warning
  - RabbitMQ down → critical
  - RabbitMQ queue depth > 1000 → warning
  - Dead-letter queue growing → warning
  - PostgreSQL down → critical
  - Redis down → critical
  - Container memory > 85% → warning
  - Container restarting > 3x in 15min → warning

### Loki (`docker/loki/`)
- Log retention: **14 days**
- Schema: tsdb v13 with filesystem storage
- WAL enabled for durability

### Promtail (`docker/promtail/`)
- **Source 1**: Docker socket — reads container stdout/stderr from containers labelled `logging=promtail`
- **Source 2**: File-based — tails `./logs/*.log` mounted at `/app/logs` in the container
- Parses all Winston JSON fields: `level`, `message`, `timestamp`, `type`, `method`, `url`, `route`, `status`, `duration_ms`, `userId`, `ip`, `requestId`
- Promotes `level`, `service`, `type` as Loki stream labels
- Drops `debug` level logs in production

### Grafana (`docker/grafana/`)
- **Auto-provisioned** on startup — no manual setup required
- Datasources: Prometheus (default) + Loki — both wired at boot
- **SkulCredit Platform Overview** dashboard panels:

| Section | Panels |
|---|---|
| API Overview | API Status (UP/DOWN), Request Rate, 5xx Error Rate, p95 Latency, HTTP Rate by Status, Response Time Percentiles (p50/p95/p99) |
| RabbitMQ | Status, Queue Depth, Messages Published/Delivered Rate |
| Request Tracking | All Requests — Full Detail, Failed Requests 4xx/5xx, Slow Requests >500ms, Top Endpoints by Hit Count, Avg Response Time per Endpoint, Auth Events |

### prom-client Metrics Exposed at `/metrics`
| Metric | Type | Description |
|---|---|---|
| `http_request_duration_seconds` | Histogram | Request duration by method/route/status |
| `http_requests_total` | Counter | Total requests by method/route/status |
| `skulcredit_active_connections` | Gauge | Current in-flight requests |
| `skulcredit_loan_applications_total` | Counter | Loan applications by status (ready to use) |
| `skulcredit_user_registrations_total` | Counter | Registrations by role (ready to use) |
| `skulcredit_login_attempts_total` | Counter | Login attempts by result (ready to use) |
| `skulcredit_process_*` | Various | Node.js process: CPU, heap, GC, event loop lag |

---

## 5. Request Tracking Middleware

Every request through the API is tracked with the following data — logged on arrival and completion:

| Field | Source | Notes |
|---|---|---|
| `requestId` | `uuid.v4()` | Unique per request; returned as `X-Request-Id` response header |
| `type` | Middleware | `request` (on arrival) or `response` (on finish) |
| `method` | `req.method` | GET, POST, PUT, DELETE, PATCH |
| `url` | `req.originalUrl` | Full URL with query string |
| `route` | Express `req.route.path` | Normalised pattern e.g. `/api/v1/parents/:id` |
| `status` | `res.statusCode` | HTTP status code |
| `success` | Derived | `true` if status < 400 |
| `outcome` | Derived | `success` / `client_error` / `server_error` |
| `duration_ms` | `hrtime.bigint()` | Sub-millisecond precision |
| `ip` | `X-Forwarded-For` / `req.ip` | Real client IP (trust proxy enabled) |
| `device.type` | ua-parser-js | `desktop` / `mobile` / `tablet` |
| `device.browser` | ua-parser-js | Chrome, Safari, Firefox, etc. |
| `device.browserVersion` | ua-parser-js | Version string |
| `device.os` | ua-parser-js | Windows, macOS, Android, iOS, etc. |
| `device.osVersion` | ua-parser-js | Version string |
| `location.country` | geoip-lite | ISO country code e.g. `NG` |
| `location.region` | geoip-lite | State/region code |
| `location.city` | geoip-lite | City name |
| `location.ll` | geoip-lite | `[latitude, longitude]` |
| `userId` | `req.user.id` | Authenticated user ID, `null` if unauthenticated |
| `userRole` | `req.user.role` | `parent` / `school` / `admin` / `null` |
| `error` | `res.locals.errorMessage` | Error reason on 4xx/5xx responses |

Log levels: `info` for 2xx/3xx, `warn` for 4xx, `error` for 5xx.  
Skipped paths: `/metrics`, `/api/v1/health`, `/favicon.ico`.

---

## 6. Configuration Files

| File | Purpose |
|---|---|
| `src/config/env.js` | Central env config — `PORT`, `APP_URL`, `DATABASE_URL`, `DB_*`, `JWT_*`, `REDIS_URL`, `RABBITMQ_URL`, `LENDSQR_*`, `PAYSTACK_*`, `CLOUDINARY_*`, `SMTP_*` |
| `src/config/db.js` | Sequelize instance — `DATABASE_URL` (production) or `DB_*` vars (local); pool config; `alter:true` sync in dev |
| `src/config/logger.js` | Winston — JSON to `logs/error.log` + `logs/combined.log` + stdout; human-readable colorised console in dev |
| `src/config/redis.js` | ioredis — exponential back-off retry (5 attempts), graceful 503 guard in controllers |
| `src/config/metrics.js` | prom-client — default Node.js metrics + HTTP histogram/counter + business counters |
| `src/config/swagger.js` | swagger-jsdoc — OpenAPI 3.0 spec built from JSDoc in route files |
| `.env` | Live secrets (not committed) |
| `.env.example` | Template with all required keys |
| `.dockerignore` | Excludes `node_modules`, `.env`, `logs`, `dist`, docs |

---

## 7. Data Models

| Model | Table | Status | Key Fields |
|---|---|---|---|
| `User` | `users` | ✅ Done | UUID PK, email (unique), password, role enum (parent/school/admin), isActive, isEmailVerified, isPhoneVerified, lastLogin |
| `Parent` | `parents` | ✅ Done | userId FK, firstName, lastName, middleName, dob, address (flattened), kycStatus enum, bvn/nin (excluded from default scope), lendsqrCustomerId |
| `School` | `schools` | ✅ Done | userId FK, schoolName, contactPerson, website, population, address (flattened), documentCac/License (Cloudinary URLs), status enum, bankName/AccountName/AccountNumber |
| `Student` | `students` | ✅ Done | parentId FK, schoolId FK, firstName, lastName, studentId, gradeLevel, tuitionAmount |
| `LoanApplication` | `loan_applications` | ✅ Done | referenceNumber, parentId/studentId/schoolId FKs, amountRequested, amountApproved, tenor, status enum (9 states), termsAccepted/At, schoolVerificationStatus/At/Note, rejectionReason, adminNote, decidedBy/At, disbursementStatus |
| `RefreshToken` | `refresh_tokens` | ✅ Done | token, userId FK, expiresAt, revokedAt, replacedByToken; `isActive`/`isExpired` instance getters |
| `SchoolRequest` | `school_requests` | ✅ Done | parentId FK, schoolName, address/city/state, contactPerson/Phone/Email, additionalNotes, status enum, adminNote |
| `ApplicationEvent` | `application_events` | ✅ Done | Immutable — loanApplicationId FK, actor enum (system/admin/parent/school), actorId, status, note; no updatedAt |
| `Notification` | `notifications` | ✅ Done | userId FK, title, message, type enum (12 types), referenceId/Type, isRead, readAt |
| `Term` / `AcademicSession` | — | ❌ Missing | Associate loans with a school term |
| `FeeSchedule` | — | ❌ Missing | Per-class, per-term tuition amounts |
| `LoanOffer` | — | ❌ Missing | Calculated offer before parent acceptance |
| `RepaymentSchedule` | — | ❌ Missing | Installment breakdown on approved loan |
| `Repayment` | — | ❌ Missing | Individual payment events |
| `Disbursement` | — | ❌ Missing | Funds sent to school |
| `AuditLog` | — | ❌ Missing | Tamper-evident admin action log |
| `SchoolStaff` | — | ❌ Missing | Sub-users within a school account |
| `ComplianceRecord` | — | ❌ Missing | Consent records, data subject requests |

---

## 8. API Endpoints

Base URL: `http://localhost:8080/api/v1`

### 8.1 Auth — `/auth`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| POST | `/auth/register/parent` | Public | ✅ Done | Register parent; sends verification email |
| POST | `/auth/register/school` | Public | ✅ Done | Register school; sends verification email |
| POST | `/auth/login` | Public | ✅ Done | Returns accessToken + refreshToken; account lockout after 5 failures |
| POST | `/auth/logout` | Bearer | ✅ Done | Client-side token drop |
| POST | `/auth/refresh-token` | Public | ✅ Done | Rotate refresh token; revoke old one |
| GET | `/auth/verify-email?token=` | Public | ✅ Done | Confirm email (24-hr Redis token) |
| POST | `/auth/resend-verification` | Public | ✅ Done | Re-send verification link |
| POST | `/auth/forgot-password` | Public | ✅ Done | Send reset link (15-min Redis token; anti-enumeration) |
| POST | `/auth/reset-password` | Public | ✅ Done | Set new password; revoke all refresh tokens |
| POST | `/auth/send-otp` | Public | ✅ Done | Send 6-digit OTP via email (30-min Redis TTL) |
| POST | `/auth/verify-otp` | Public | ✅ Done | Verify OTP; single-use (deleted on success) |
| POST | `/auth/admin/create` | Admin | ✅ Done | Create admin account (isEmailVerified bypassed) |

### 8.2 Parent — `/parents`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/parents/schools` | Public | ✅ Done | Paginated partner school directory (search, city, state filters) |
| GET | `/parents/profile` | Parent | ✅ Done | Fetch own profile + user info |
| PUT | `/parents/profile` | Parent | ✅ Done | Update name, address, DOB |
| PUT | `/parents/change-password` | Parent | ✅ Done | Change password (verifies current) |
| POST | `/parents/kyc` | Parent | ⚠️ Partial | BVN verify + Lendsqr customer create; NIN stored not verified |
| GET | `/parents/students` | Parent | ✅ Done | List all students with school details |
| POST | `/parents/students` | Parent | ✅ Done | Add student; validates school is approved |
| GET | `/parents/students/:id` | Parent | ✅ Done | Get single student |
| PUT | `/parents/students/:id` | Parent | ✅ Done | Update student; validates new school if changed |
| DELETE | `/parents/students/:id` | Parent | ✅ Done | Delete student; blocked if active loans exist |
| GET | `/parents/applications` | Parent | ✅ Done | List all own loan applications |
| GET | `/parents/applications/:id` | Parent | ✅ Done | Get single application with full event timeline |
| GET | `/parents/school-requests` | Parent | ✅ Done | List own school partnership requests |
| POST | `/parents/school-requests` | Parent | ✅ Done | Submit new school request; blocks duplicate pending |
| GET | `/parents/dashboard` | Parent | ✅ Done | Profile + stats (total/active/pending loans) + recent applications |

### 8.3 School — `/schools`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/schools/profile` | School | ✅ Done | Fetch own school profile + user info |
| PUT | `/schools/profile` | School | ✅ Done | Update contact, address, website (non-sensitive only) |
| PUT | `/schools/complete-registration` | School | ✅ Done | Submit KYB info; sets status to `under_review` |
| PUT | `/schools/bank-details` | School | ⚠️ Partial | Save bank details; no Adjutor account-name lookup yet |
| GET | `/schools/applications` | School | ✅ Done | Paginated application queue; filterable by status |
| GET | `/schools/applications/:id` | School | ✅ Done | Single application (student + fee only; parent financial data excluded) |
| PUT | `/schools/applications/:id/verify-enrollment` | School | ✅ Done | Confirm or reject student enrollment; creates ApplicationEvent; transitions status |
| GET | `/schools/dashboard` | School | ✅ Done | Stats (students, apps, pending verification) + recent applications |

### 8.4 Admin — `/admin`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/admin/dashboard` | Admin | ⚠️ Partial | Counts only (parents, schools, pending schools, pending loans) |
| GET | `/admin/schools` | Admin | ✅ Done | All schools; filterable by status; includes user info |
| PUT | `/admin/schools/:id/approve` | Admin | ✅ Done | Approve school |
| PUT | `/admin/schools/:id/reject` | Admin | ✅ Done | Reject school; no reason recorded yet |
| GET | `/admin/parents` | Admin | ✅ Done | All parents with user info |
| GET | `/admin/loans` | Admin | ✅ Done | All loan applications with student + school |
| GET | `/admin/schools/:id` | Admin | ❌ Missing | Single school detail |
| PUT | `/admin/schools/:id/suspend` | Admin | ❌ Missing | Suspend / reactivate school |
| GET | `/admin/parents/:id` | Admin | ❌ Missing | Single parent with full history |
| PUT | `/admin/parents/:id/action` | Admin | ❌ Missing | Hold / fraud-flag / unhold / unflag |
| GET | `/admin/loans/:id` | Admin | ❌ Missing | Single application full view |
| PUT | `/admin/loans/:id/decision` | Admin | ❌ Missing | Approve / reject / request_info with ApplicationEvent |
| GET | `/admin/school-requests` | Admin | ❌ Missing | View and manage school partnership requests |

### 8.5 Loans — `/loans`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| POST | `/loans/eligibility` | Parent | ⚠️ Partial | Calls Lendsqr; paths unverified |
| POST | `/loans/apply` | Parent | ⚠️ Partial | Creates LoanApplication + calls Lendsqr; no referenceNumber, no T&C gate |

### 8.6 Payments — `/payments`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| POST | `/payments/initialize` | Bearer | ⚠️ Partial | Generic Paystack init; not tied to a repayment installment |
| GET | `/payments/verify/:reference` | Bearer | ⚠️ Partial | Verify Paystack transaction; does not update any repayment record |

### 8.7 Upload — `/upload`

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| POST | `/upload/document` | Bearer | ✅ Done | Upload file to Cloudinary (PDF/JPG/PNG, max 5MB); returns URL |

### 8.8 System

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/v1/health` | Public | ✅ Done | Server health check |
| GET | `/metrics` | Public (internal) | ✅ Done | Prometheus metrics scrape endpoint |
| GET | `/api/v1/docs` | Public | ✅ Done | Swagger UI |
| GET | `/api/v1/docs.json` | Public | ✅ Done | Raw OpenAPI JSON (Postman import) |

---

## 9. Middleware Stack (in order)

```
helmet()                    → Security headers
cors()                      → CORS (all origins; restrict in production)
rateLimit()                 → 100 req / 15min per IP on /api/*
express.json()              → JSON body parsing (10MB limit)
express.urlencoded()        → Form body parsing
requestTracker              → requestId, IP, device, location, structured logging
requestMetricsMiddleware    → Prometheus histogram/counter per request
[routes]                    → Auth/RBAC middleware per router
errorHandler                → Sequelize + Zod error normalisation; stores error in res.locals
```

---

## 10. Missing Integrations

| Integration | Status | Notes |
|---|---|---|
| Mono (bank linking + statement retrieval) | ❌ Not started | Required for financial verification |
| NIN via NIMC / Adjutor | ❌ Not called | `identityService.verifyNin()` defined but never invoked |
| Bank account name lookup (Adjutor) | ❌ Not started | Required for school bank verification |
| Karma / watchlist check (Adjutor) | ❌ Not started | Required before KYC approval + loan decision |
| SMS provider (Termii / Africa's Talking) | ❌ Not started | OTP and alerts are email-only |
| Paystack Transfers API (school disbursement) | ❌ Not started | |
| Paystack Direct Debit / Mandate | ❌ Not started | |
| Paystack inbound webhook | ❌ Not started | |
| reCAPTCHA | ❌ Not started | |
| Analytics (Mixpanel / Amplitude / GA4) | ❌ Not started | |

---

## 11. Lendsqr / Adjutor Endpoints Needed

### Identity
| Endpoint | Status |
|---|---|
| `GET /v2/verification/bvn/{bvn}` | ✅ Wired |
| `GET /v2/verification/nin/{nin}` | ❌ Defined but never called |
| `GET /v2/verification/bvn-with-image/{bvn}` | ❌ Optional |

### Customer
| Endpoint | Status |
|---|---|
| `POST /v1/customers` | ✅ Wired |
| `GET /v1/customers/{id}` | ❌ |
| `PUT /v1/customers/{id}` | ❌ |
| `GET /v1/customers/{id}/credit-bureau` | ❌ |
| `GET /v1/customers/{id}/loans` | ❌ |

### Loan / Credit
| Endpoint | Status |
|---|---|
| `POST /v1/loans/eligibility` | ⚠️ Wired (paths unverified) |
| `POST /v1/loans/apply` | ⚠️ Wired (paths unverified) |
| `GET /v1/loans/applications/{id}` | ❌ |
| `GET /v1/loans/{id}` + schedule | ❌ |
| `POST /v1/loans/{id}/approve` + reject | ❌ |
| `GET/POST /v1/loans/{id}/repayments` | ❌ |

### Bank Verification
| Endpoint | Status |
|---|---|
| `GET /v1/verification/bank-account` | ❌ |
| `GET /v1/verification/banks` | ❌ |

### Karma
| Endpoint | Status |
|---|---|
| `GET /v1/karma/{identity}` | ❌ |
| `POST /v1/karma` | ❌ |

### Inbound Webhooks (Lendsqr → SkulCredit)
| Event | Status |
|---|---|
| `loan.application.approved` / `rejected` / `pending_review` | ❌ |
| `loan.disbursed` / `disbursement.failed` | ❌ |
| `loan.repayment.successful` / `failed` / `overdue` | ❌ |
| `customer.created` | ✅ Handled in KYC flow |

---

## 12. Progress Summary

| Layer | % Complete | Status |
|---|---|---|
| Tech stack & dependencies | ~100% | All packages installed and configured |
| Docker + compose | ~100% | All 8 services, healthchecks, networks, volumes |
| Monitoring (Prometheus + Grafana) | ~95% | Live, scraping, dashboards populated. Business counters wired but not incremented |
| Log pipeline (Loki + Promtail) | ~90% | File + Docker socket; structured JSON with requestId/device/location |
| Request tracking middleware | ~100% | requestId, device, geo-location, userId, outcome on every request |
| Authentication module | ~92% | All flows done. SMS 2FA gate only missing |
| Parent module | ~80% | All in-house CRUD done. Mono, repayment, notifications still missing |
| School module | ~65% | Profile, registration, app queue, enrollment verification done. Disbursement, reports, staff missing |
| Admin module | ~35% | Basic CRUD done. Single-record views, loan decisions, suspend/hold, compliance missing |
| Loan lifecycle | ~20% | referenceNumber field exists; nothing generates it. T&C gate, status transitions, disbursement trigger missing |
| Payment module | ~15% | Paystack init/verify only. Webhook, Repayment model, disbursement transfer missing |
| Lendsqr integration | ~20% | BVN + customer wired; NIN/karma/schedule/webhook missing; paths unverified |
| Missing models | ~55% | 9 models absent (Term, FeeSchedule, LoanOffer, RepaymentSchedule, Repayment, Disbursement, AuditLog, SchoolStaff, ComplianceRecord) |

---

## 13. Recommended Next Build Order

1. ~~Persistence layer (Redis, PostgreSQL)~~ ✅ Done
2. ~~Auth completeness (forgot-password, email verify, lockout, admin create)~~ ✅ Done
3. ~~Request tracking (requestId, device, location, structured logs)~~ ✅ Done
4. ~~In-house CRUD — Parent module~~ ✅ Done
5. ~~In-house CRUD — School module~~ ✅ Done
6. **In-house CRUD — Admin module** — single-record views, loan decisions, suspend/hold, school request management ← **NEXT**
7. **Loan lifecycle** — reference number generation, T&C gate, status transitions with ApplicationEvent
8. **Notification endpoints** — GET/read/mark-read for the Notification model (model exists, no routes)
9. **Lendsqr API verification** — confirm actual Adjutor paths, NIN, karma, bank account name lookup
10. **Mono integration** — bank linking, statement retrieval, manual upload fallback
11. **Missing models** — Term, RepaymentSchedule, Repayment, Disbursement, LoanOffer
12. **Paystack** — school disbursement transfer, direct debit mandate, inbound webhook handler
13. **Admin portal depth** — sub-roles, compliance module, audit log, portfolio analytics
14. **Reporting** — portfolio dashboards, CSV/PDF export


# TEST CASE
## Grafana (monitoring dashboard)
http://localhost:3000
Login: admin / skulcredit_grafana

## RabbitMQ Management UI
http://localhost:15672
Login: skulcredit / skulcredit_pass

# Prometheus
3. http://localhost:9090/ (Prometheus)

# Swagger 
http://localhost:8080/api/v1/docs/