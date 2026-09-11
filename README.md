# SkulCredit

SkulCredit is a school-fee financing platform. Parents apply for loans to cover tuition, schools confirm enrollment, and admins manage the full approval and disbursement pipeline.

The repository is a monorepo containing the backend API, the React frontend, and all infrastructure configuration (nginx, Docker Compose, monitoring).

---

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [DevOps & Infrastructure](#devops--infrastructure)
5. [Running the Application](#running-the-application)
6. [Environment Variables](#environment-variables)
7. [Authentication & Security](#authentication--security)
8. [API Reference](#api-reference)
   - [Auth](#auth-endpoints)
   - [Parents](#parent-endpoints)
   - [Schools](#school-endpoints)
   - [Admin](#admin-endpoints)
   - [Loans](#loan-endpoints)
   - [Payments](#payment-endpoints)
   - [Upload](#upload-endpoint)
   - [Notifications](#notification-endpoints)
   - [Health & Metrics](#health--metrics-endpoints)
9. [Request / Response Shapes](#request--response-shapes)
10. [Frontend Architecture](#frontend-architecture)
11. [Monitoring & Observability](#monitoring--observability)
12. [Seed Data](#seed-data)

---

## Repository Structure

```
SkulCredit/
├── docker-compose.yml              # Full stack orchestration
├── nginx/                          # Edge reverse proxy
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── conf.d/
│   │   ├── 01-security-headers.conf
│   │   ├── 02-rate-limiting.conf
│   │   ├── 03-bot-detection.conf
│   │   ├── 04-upstreams.conf
│   │   ├── 05-server-http.conf     # Main routing (API, SPA, sockets, metrics)
│   │   ├── 06-server-https.conf    # TLS (ready to enable)
│   │   ├── 07-error-pages.conf
│   │   ├── 08-security-blocks.conf # WAF-style URI pattern blocks
│   │   ├── 09-administrative-security.conf
│   │   ├── 10-health-checks.conf
│   │   ├── 11-content-cache.conf
│   │   ├── globalblacklist.conf    # Bad-bot UA blacklist
│   │   └── swagger-locations.conf
│   ├── html/                       # Custom error pages (400–50x)
│   └── ssl/                        # TLS certs (mount at runtime)
│
├── skulcredit-backend/
│   ├── src/
│   │   ├── app.ts                  # Express setup, middleware, routes
│   │   ├── server.ts               # HTTP server bootstrap
│   │   ├── config/
│   │   │   ├── db.ts               # Sequelize + PostgreSQL
│   │   │   ├── env.ts              # Typed env config
│   │   │   ├── firebase.ts         # Firebase Admin SDK (FCM)
│   │   │   ├── logger.ts           # Winston structured logging
│   │   │   ├── metrics.ts          # prom-client setup
│   │   │   ├── rabbitmq.ts         # AMQP connection
│   │   │   ├── redis.ts            # ioredis client
│   │   │   ├── socketio.ts         # Socket.IO initialisation
│   │   │   └── swagger.ts          # OpenAPI 3.0 spec
│   │   ├── controllers/            # Request handlers (thin layer)
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  # JWT verification (protect)
│   │   │   ├── rbac.middleware.ts  # Role-based access (authorize)
│   │   │   ├── errorHandler.ts     # Centralised error formatter
│   │   │   ├── requestTracker.ts   # Request-ID injection
│   │   │   └── validate.middleware.ts # Zod request validation
│   │   ├── models/                 # Sequelize models + associations
│   │   ├── notifications/
│   │   │   ├── auth.event.publisher.ts
│   │   │   ├── notification.types.ts
│   │   │   └── rabbitmq.listener.ts
│   │   ├── repositories/           # DB abstraction layer
│   │   ├── routes/
│   │   │   ├── index.ts            # Root router (/api/v1)
│   │   │   ├── auth.routes.ts
│   │   │   ├── parent.routes.ts
│   │   │   ├── school.routes.ts
│   │   │   ├── loan.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   └── upload.routes.ts
│   │   ├── services/               # Core business logic
│   │   ├── utils/
│   │   │   ├── apiError.ts
│   │   │   └── response.ts         # Standardised success/error helpers
│   │   └── validators/             # Zod schemas
│   ├── docker/                     # Monitoring configs (mounted by compose)
│   │   ├── prometheus/
│   │   ├── loki/
│   │   ├── promtail/
│   │   ├── grafana/
│   │   └── rabbitmq/
│   ├── scripts/seed.ts             # Database seeder
│   ├── Dockerfile
│   └── package.json
│
└── skulcredit-frontend/
    ├── src/
    │   ├── config/env.ts           # VITE_API_BASE_URL
    │   ├── context/AuthContext.tsx # Auth state, session bootstrap
    │   ├── services/
    │   │   ├── api.ts              # Token (memory) + user (localStorage) storage
    │   │   ├── apiClient.ts        # Axios instance + silent refresh interceptor
    │   │   ├── authService.ts
    │   │   ├── parentService.ts
    │   │   ├── schoolService.ts
    │   │   ├── paymentService.ts
    │   │   └── dashboardService.ts
    │   ├── pages/
    │   │   ├── Auth/               # ParentAuthPage, SchoolAuthPage, AdminAuthPage
    │   │   ├── ParentFlow/         # Dashboard, eligibility, applications, settings
    │   │   └── SchoolFlow/         # Dashboard, applications, profile
    │   └── components/
    ├── Dockerfile                  # Multi-stage: Vite build → nginx:alpine
    ├── nginx-spa.conf              # SPA fallback (try_files → index.html)
    └── vite.config.ts
```

---

## Technology Stack

### Backend

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Language | TypeScript |
| Database | PostgreSQL 16 (via Sequelize 6) |
| Cache / OTP | Redis 7 (ioredis) |
| Message queue | RabbitMQ 3.13 |
| Real-time | Socket.IO 4 |
| Auth | JWT (jsonwebtoken) + httpOnly cookie refresh |
| Password hashing | bcryptjs |
| Validation | Zod 4 |
| File storage | Cloudinary |
| Email | Nodemailer (SMTP) |
| Push notifications | Firebase Admin SDK (FCM) |
| KYC / credit | Lendsqr Adjutor API |
| Payments | Paystack |
| Metrics | prom-client |
| Logging | Winston (JSON) |
| API docs | Swagger UI (`/api/v1/docs`) |

### Frontend

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router 6 |
| HTTP client | Axios (with silent refresh interceptor) |
| Styling | Tailwind CSS |
| Icons | Lucide / custom SVG |

### Infrastructure

| Component | Choice |
|---|---|
| Container runtime | Docker + Docker Compose |
| Edge proxy | nginx 1.27 (WAF, rate-limiting, bot-blocking, caching) |
| Metrics | Prometheus → Grafana |
| Log aggregation | Promtail → Loki → Grafana |
| Alerting | Prometheus Alertmanager rules |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## Architecture Overview

```
Browser
  │
  ▼
┌─────────────────────────────────────┐
│  nginx  (port 80 / 443)             │
│                                     │
│  /api/v1/*  ──────────────────────► │  Express API  :808 │
│                                     │  React SPA    :80 (internal)
└─────────────────────────────────────┘    │
                                           │
           ┌───────────────────────────────┼────────────────────┐
           ▼                               ▼                    ▼
      PostgreSQL                         Redis              RabbitMQ
      (Sequelize ORM)              (OTP / lockout)    (async email / push)
                                                             │
                                                   notification listener
                                                   (email + FCM push)
```

Request flow for authenticated calls:

1. Browser sends `Authorization: Bearer <access_token>` (from memory).
2. nginx proxies to the Express API; passes `Cookie` header through.
3. When the access token expires (30 min), the API returns 401.
4. The Axios interceptor fires **once** — all concurrent requests are queued.
5. A `POST /api/v1/auth/refresh-token` is made — the browser sends the `sc_refresh` httpOnly cookie automatically.
6. The backend rotates the refresh token and returns a new access token.
7. The interceptor stores the new token in memory, drains the queue, and retries the original requests transparently.
8. If the refresh token is also expired/revoked, the cookie is cleared, `auth:session-expired` is dispatched, and the user is redirected to login.

---

## DevOps & Infrastructure

### Docker Compose Services

| Service | Container | Internal Port | Public Port | Notes |
|---|---|---|---|---|
| `nginx` | skulcredit_nginx | — | 80, 443 | Edge proxy, only public entry point |
| `api` | skulcredit_api | 8080 | — | Express backend |
| `frontend` | skulcredit_frontend | 80 | — | React SPA served by nginx |
| `postgres` | skulcredit_postgres | 5432 | — | Primary database |
| `redis` | skulcredit_redis | 6379 | — | OTP, session lockouts |
| `rabbitmq` | skulcredit_rabbitmq | 5672, 15672 | — | AMQP + management UI |
| `prometheus` | skulcredit_prometheus | 9090 | — | Metrics collection |
| `loki` | skulcredit_loki | 3100 | — | Log storage |
| `promtail` | skulcredit_promtail | — | — | Log shipper |
| `grafana` | skulcredit_grafana | 3000 | **3000** | Dashboards |

All services except nginx and Grafana are internal-only (`expose:` not `ports:`).

### Networks

- `app_net` — api, frontend, postgres, redis, rabbitmq
- `monitoring_net` — api, postgres, redis, rabbitmq, prometheus, loki, promtail, grafana

### Nginx Architecture

The edge nginx is split into modular conf.d files loaded in order:

| File | Purpose |
|---|---|
| `01-security-headers.conf` | Security headers (CSP, X-Frame-Options, etc.) |
| `02-rate-limiting.conf` | Rate-limit zones (auth: 10/min, API: 20/s, txn: 5/min) |
| `03-bot-detection.conf` | Malicious URI patterns, suspicious UA detection, JWT format check |
| `04-upstreams.conf` | Upstream pools (`api:8080`, `frontend:80`) |
| `05-server-http.conf` | Main server block — routes traffic, includes sub-configs |
| `06-server-https.conf` | TLS config (commented out until cert is available) |
| `07-error-pages.conf` | JSON error responses for 4xx/5xx |
| `08-security-blocks.conf` | WAF patterns (path traversal, SQLi, XSS, scanners) |
| `09-administrative-security.conf` | Admin routes with full WAF + rate-limit stack |
| `10-health-checks.conf` | `/nginx-health`, `/backend-health`, `/internal/metrics` |
| `11-content-cache.conf` | API response cache zones |
| `globalblacklist.conf` | 500+ known bad-bot UA strings |
| `swagger-locations.conf` | `/docs` redirect, `/api/v1/docs/*` proxy |

### CI/CD

`.github/workflows/ci.yml` — runs on every push/PR:
- Install dependencies
- TypeScript type-check
- Lint
- Build

---

## Running the Application

### Prerequisites

- Docker Desktop (with WSL2 backend on Windows)
- Node.js 20+ (for local development only)

### Full stack (Docker)

```bash
# Clone and start everything
git clone <repo-url>
cd SkulCredit

# First run — build all images and start
docker compose up -d --build

# View logs
docker compose logs -f api
docker compose logs -f nginx

# Stop everything
docker compose down
```

Services will be available at:

| URL | Service |
|---|---|
| `http://localhost` | React SPA + API (via nginx) |
| `http://localhost/api/v1/docs` | Swagger UI |
| `http://localhost/api/v1/health` | API health check |
| `http://localhost/health` | nginx health check |
| `http://localhost:3000` | Grafana (admin / skulcredit_grafana) |

### Backend development (local)

```bash
cd skulcredit-backend
cp .env.example .env   # fill in secrets
npm install
npm run dev            # tsx watch — hot reload
```

### Frontend development (local)

```bash
cd skulcredit-frontend
npm install
# VITE_API_BASE_URL defaults to http://localhost:8080/api/v1
npm run dev            # http://localhost:5173
```

### Seed the database

```bash
# After the stack is up — seeds parent, school, and admin accounts
docker compose exec api npx tsx scripts/seed.ts
```

Or directly against a local dev database:

```bash
cd skulcredit-backend
npx tsx scripts/seed.ts
```

Seeded credentials:

| Email | Password | Role |
|---|---|---|
| parent@example.com | Password@123 | parent |
| school@example.com | Password@123 | school |
| admin@example.com | Admin@secure1 | admin |

---

## Environment Variables

All variables live in `skulcredit-backend/.env`. Copy `.env.example` to get started.

```env
# Server
PORT=8080
NODE_ENV=development
APP_URL=http://localhost:8080

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/skulcredit
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=skulcredit
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=30m
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=SkulCredit
JWT_AUDIENCE=skulcredit-api

# Integrations
LENDSQR_API_KEY=your_adjutor_api_key
LENDSQR_BASE_URL=https://api.adjutor.io
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@skulcredit.com
SMTP_PASS=your_smtp_password

# Infrastructure
REDIS_URL=redis://127.0.0.1:6379
RABBITMQ_URL=amqp://skulcredit:skulcredit_pass@localhost:5672/skulcredit_vhost
RABBITMQ_PASSWORD=skulcredit_pass

# Firebase (push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Socket.IO CORS (comma-separated origins in prod)
SOCKETIO_CORS_ORIGIN=http://localhost:5173

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=skulcredit_grafana
```

---

## Authentication & Security

### Token Strategy

| Token | Location | Lifetime | Notes |
|---|---|---|---|
| Access token | JS memory only | 30 minutes | Attached as `Authorization: Bearer` header |
| Refresh token | httpOnly cookie (`sc_refresh`) | 7 days | Never accessible to JavaScript |

**Why this approach:**
- Access token in memory is invisible to `localStorage`-scraping XSS attacks.
- Refresh token in an httpOnly cookie is invisible to JavaScript entirely; CSRF is mitigated by `SameSite=Strict` in production.
- On page reload, `AuthContext` calls `POST /api/v1/auth/refresh-token` silently — the browser sends the cookie automatically, and a fresh access token is returned.

### Silent Refresh Flow (frontend)

```
App mounts
  └─► AuthContext.bootstrap()
        └─► POST /api/v1/auth/refresh-token  (cookie sent automatically)
              ├─ 200 → store new access token in memory, render app
              └─ 401 → clear profile, redirect to /auth
```

### Concurrent Request Queuing

If three requests fire simultaneously and all hit 401:

```
Request A, B, C  →  all get 401
Request A starts refresh  (isRefreshing = true)
Request B, C  →  queued in refreshQueue[]
Refresh succeeds  →  processQueue(newToken)
Request B, C  →  retried with new token
```

### Account Lockout

After 5 consecutive failed login attempts the account is locked for 15 minutes. The lock state is stored in Redis (`lockout:<email>` / `cooldown:<email>`).

### RBAC

Three roles: `parent`, `school`, `admin`. The `protect` middleware verifies the JWT; `authorize(...roles)` checks the role claim. All role checks happen at the route level before the controller is reached.

---

## API Reference

**Base URL:** `http://localhost/api/v1` (via nginx) or `http://localhost:8080/api/v1` (direct)

**Interactive docs:** `http://localhost/api/v1/docs`

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

All responses follow this envelope:

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": [ { "field": "...", "message": "..." } ] }
```

---

### Auth Endpoints

#### `GET /auth/check-availability`

Check whether an email or phone number is already registered.

**Query params:**

| Param | Type | Description |
|---|---|---|
| email | string | Email to check |
| phone | string | Phone number to check |

**Response 200:**
```json
{ "success": true, "data": { "email": true, "phone": false } }
```
`true` = available, `false` = already taken.

---

#### `POST /auth/register/parent`

Register a new parent account. Sends a 6-digit OTP to the supplied email.

**Body:**
```json
{
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "email": "parent@example.com",
  "phoneNumber": "08011111111",
  "password": "Password@123"
}
```

Password rules: ≥8 chars, uppercase, lowercase, number, special character.

**Response 201:**
```json
{
  "success": true,
  "message": "Parent registered successfully. Check your email to verify your account.",
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "parent", ... },
    "parent": { "id": "uuid", "firstName": "John", "lastName": "Doe", ... }
  }
}
```

---

#### `POST /auth/register/school`

Register a new school account.

**Body:**
```json
{
  "schoolName": "Greenwood High School",
  "contactPerson": "Jane Principal",
  "email": "school@example.com",
  "phoneNumber": "08022222222",
  "password": "Password@123"
}
```

**Response 201:** Same envelope as parent registration.

---

#### `POST /auth/login`

**Body:**
```json
{ "email": "parent@example.com", "password": "Password@123" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "parent@example.com",
      "role": "parent",
      "isEmailVerified": true,
      "isActive": true,
      "phoneNumber": "08011111111",
      "lastLogin": "2026-09-11T09:00:00.000Z",
      "profile": { "firstName": "John", "middleName": null, "lastName": "Doe" }
    },
    "accessToken": "eyJ..."
  }
}
```

The refresh token is **not** in the response body — it is set as an httpOnly cookie named `sc_refresh`.

**Errors:** `401 Invalid credentials`, `429 Account temporarily locked (N minutes)`

---

#### `POST /auth/logout`

Revokes the refresh token and clears the `sc_refresh` cookie.

**Auth:** Bearer token required.

**Response 200:** `{ "success": true, "message": "Logout successful" }`

---

#### `POST /auth/refresh-token`

Exchange the `sc_refresh` httpOnly cookie for a new access token. The refresh token is rotated on every call.

**Body:** `{}` (empty — token comes from the cookie automatically)

**Response 200:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": { "accessToken": "eyJ..." }
}
```

A new `sc_refresh` cookie is set with the rotated refresh token.

**Errors:** `401` — cookie absent, expired, or revoked. The cookie is cleared.

---

#### `POST /auth/send-otp`

Send (or resend) a 6-digit OTP for email verification. Valid for 30 minutes.

**Body:** `{ "email": "parent@example.com" }`

**Response 200:** `{ "success": true, "message": "OTP sent successfully" }`

---

#### `POST /auth/verify-otp`

Verify the OTP and mark the email as verified.

**Body:**
```json
{ "email": "parent@example.com", "otp": "482910" }
```

**Response 200:** `{ "success": true, "message": "Email verified successfully. You can now log in." }`

---

#### `POST /auth/resend-verification`

Resend a verification OTP to an unverified email.

**Body:** `{ "email": "parent@example.com" }`

---

#### `GET /auth/verify-email?token=<token>`

Link-based email verification (legacy — OTP flow is preferred). Token valid 24 hours.

---

#### `POST /auth/forgot-password`

Sends a 6-digit password reset OTP. Always returns 200 regardless of whether the email exists (prevents enumeration).

**Body:** `{ "email": "parent@example.com" }`

---

#### `POST /auth/reset-password`

Reset the password using the OTP from `forgot-password`. Revokes all active refresh tokens.

**Body:**
```json
{ "email": "parent@example.com", "otp": "123456", "password": "NewPass@123" }
```

---

#### `POST /auth/admin/create`

Create a new admin account. Requires an existing admin's JWT.

**Auth:** Bearer token (admin role)

**Body:**
```json
{ "email": "newadmin@skulcredit.com", "password": "Admin@secure1", "phoneNumber": "08044444444" }
```

---

### Parent Endpoints

All require `Authorization: Bearer <token>` (role: `parent`).

#### `GET /parents/dashboard`

Returns profile completion status, stats (total students, active loans, total disbursed), and recent applications.

---

#### `GET /parents/profile`

Returns the full parent profile including KYC status and address.

#### `PUT /parents/profile`

**Body:**
```json
{
  "middleName": "Michael",
  "dob": "1988-05-14",
  "addressStreet": "12 Elm Street",
  "addressCity": "Lagos",
  "addressState": "Lagos",
  "addressPostalCode": "100001",
  "addressCountry": "Nigeria"
}
```

---

#### `PUT /parents/change-password`

**Body:**
```json
{ "currentPassword": "OldPass@123", "newPassword": "NewPass@456" }
```

---

#### `POST /parents/kyc`

Submit BVN/NIN for Lendsqr Adjutor KYC verification.

**Body:**
```json
{ "bvn": "12345678901", "nin": "98765432109" }
```

---

#### `GET /parents/students`

List all students linked to this parent.

#### `POST /parents/students`

**Body:**
```json
{
  "firstName": "Amara",
  "lastName": "Doe",
  "studentId": "GWH/2025/001",
  "gradeLevel": "JSS 2",
  "tuitionAmount": 250000,
  "schoolId": "uuid"
}
```

#### `GET /parents/students/:id`
#### `PUT /parents/students/:id`
#### `DELETE /parents/students/:id`

Delete is blocked if the student has active loans.

---

#### `GET /parents/applications`

List all loan applications for this parent.

#### `GET /parents/applications/:id`

Full application detail including event timeline.

---

#### `GET /parents/schools`

Browse approved partner schools. Public — no auth required.

**Query params:** `search`, `city`, `state`, `page` (default 1), `limit` (default 20)

---

#### `GET /parents/school-requests`

List school partnership requests submitted by this parent.

#### `POST /parents/school-requests`

Request a school not yet on the platform to be onboarded.

**Body:**
```json
{
  "schoolName": "Springfield Academy",
  "schoolAddress": "5 Maple Ave",
  "schoolCity": "Abuja",
  "schoolState": "FCT",
  "contactPerson": "Mr. Burns",
  "contactPhone": "08055555555",
  "contactEmail": "info@springfield.edu.ng",
  "additionalNotes": "Large school, ~2000 students"
}
```

---

### School Endpoints

All require Bearer token (role: `school`).

#### `GET /schools/dashboard`

Stats: total applications, pending verifications, disbursed amount, recent activity.

#### `GET /schools/profile`
#### `PUT /schools/profile`

**Body:**
```json
{
  "website": "https://greenwoodhigh.edu.ng",
  "population": "1500",
  "addressStreet": "1 School Road",
  "addressCity": "Ikeja",
  "addressState": "Lagos",
  "addressCountry": "Nigeria",
  "documentCac": "https://res.cloudinary.com/...",
  "documentLicense": "https://res.cloudinary.com/..."
}
```

#### `PUT /schools/complete-registration`

Submit school information for KYB (Know Your Business) admin review. Same body as profile update.

#### `PUT /schools/bank-details`

**Body:**
```json
{
  "bankName": "GTBank",
  "accountName": "Greenwood High School",
  "accountNumber": "0123456789"
}
```

#### `GET /schools/applications`

**Query params:** `status`, `page`, `limit`

Status values: `pending`, `under_review`, `info_requested`, `school_verification`, `approved`, `rejected`, `disbursed`, `repaid`, `cancelled`

#### `GET /schools/applications/:id`

#### `PUT /schools/applications/:id/verify-enrollment`

Confirm or reject that the student is enrolled and the fee amount is correct.

**Body:**
```json
{
  "action": "confirm",
  "confirmedTuitionAmount": 245000,
  "note": "Student enrolled in JSS 2B"
}
```

`action`: `"confirm"` or `"reject"`

---

### Admin Endpoints

All require Bearer token (role: `admin`).

#### `GET /admin/dashboard`

Portfolio overview: total schools, parents, loan volume, approval rates.

#### `GET /admin/schools?status=pending`

Status filter values: `pending`, `under_review`, `approved`, `rejected`

#### `PUT /admin/schools/:id/approve`
#### `PUT /admin/schools/:id/reject`

#### `GET /admin/parents`

#### `GET /admin/loans`

---

### Loan Endpoints

Bearer token required (role: `parent`).

#### `POST /loans/eligibility`

Check Lendsqr Adjutor eligibility for a given loan amount. Requires KYC to be completed first.

**Body:**
```json
{ "amount": 200000 }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "maxAmount": 500000,
    "recommendedTenor": 3,
    "details": { ... }
  }
}
```

#### `POST /loans/apply`

Submit a school-fee loan application.

**Body:**
```json
{
  "studentId": "uuid",
  "amount": 200000,
  "tenor": 3
}
```

`tenor` is in months.

**Response 201:**
```json
{
  "success": true,
  "message": "Loan application submitted",
  "data": { "applicationId": "uuid", "status": "pending", ... }
}
```

---

### Payment Endpoints

#### `POST /payments/initialize`

Initialize a Paystack transaction.

**Body:**
```json
{ "amount": 50000, "metadata": { "loanId": "uuid", "type": "repayment" } }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "..."
  }
}
```

#### `GET /payments/verify/:reference`

Verify a Paystack transaction after the user completes checkout.

---

### Upload Endpoint

#### `POST /upload/document`

Upload a document to Cloudinary. Accepts PDF, JPG, PNG up to 5 MB.

**Content-Type:** `multipart/form-data`

**Body:** Form field `file` (binary)

**Response 200:**
```json
{
  "success": true,
  "data": { "url": "https://res.cloudinary.com/your-cloud/..." }
}
```

---

### Notification Endpoints

Bearer token required.

#### `GET /notifications?page=1&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "title": "Loan Approved",
        "body": "Your application #1234 has been approved.",
        "isRead": false,
        "createdAt": "2026-09-11T09:00:00.000Z"
      }
    ],
    "unreadCount": 3,
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

#### `PUT /notifications/read-all`

Mark all notifications as read.

#### `PUT /notifications/:id/read`

#### `DELETE /notifications/:id`

#### `POST /notifications/device-token`

Register a Firebase FCM device token for push notifications.

**Body:**
```json
{ "token": "fcm_device_token_here", "platform": "android" }
```

`platform`: `ios`, `android`, or `web`

#### `DELETE /notifications/device-token`

**Body:** `{ "token": "fcm_device_token_here" }`

---

### Health & Metrics Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /health` | None | nginx self-check — `{"status":"healthy","service":"skulcredit-nginx"}` |
| `GET /api/v1/health` | None | API health — `{"success":true,"message":"Server is running","version":"1.0.0"}` |
| `GET /nginx-health` | None | nginx health (alternate path) |
| `GET /backend-health` | Internal only | Proxies to API health (monitoring stack only) |
| `GET /metrics` | Internal only | Prometheus scrape endpoint (nginx blocks external access) |

---

## Request / Response Shapes

### Standard success envelope

```typescript
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}
```

### Standard error envelope

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}
```

### HTTP status codes used

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No content (CORS preflight) |
| 400 | Validation error / bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited / account locked |
| 500 | Internal server error |
| 503 | Service unavailable (Redis/RabbitMQ down) |

---

## Frontend Architecture

### Auth Flow

```
/auth  →  ParentAuthPage
           ├── login view      → useAuth().login() → navigate('/parent/dashboard')
           ├── signup view     → POST /auth/register/parent → OTP view
           ├── otp view        → POST /auth/verify-otp → back to login
           └── forgot view     → POST /auth/forgot-password → reset view
                                  → POST /auth/reset-password
```

### Protected Routes

`RequireAuth` component wraps all dashboard routes. If `isLoading` (bootstrap in progress), it shows a spinner. If unauthenticated, redirects to `/auth`. If wrong role, redirects to `/`.

`RedirectIfAuthenticated` wraps the auth pages — logged-in users are bounced to their role's dashboard automatically.

### Service Layer

All API calls go through `apiClient` (the Axios instance). Service files (`authService`, `parentService`, etc.) are thin wrappers that provide typed request/response contracts. Components never call `axios` directly.

### Token Storage Design

```
┌─────────────────────────────────────────────────┐
│  Access token    JS module memory (_accessToken) │  ← invisible to XSS
│  Refresh token   httpOnly cookie (sc_refresh)    │  ← invisible to JS
│  User profile    localStorage (sc_user)          │  ← display data only
└─────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Prometheus Scrape Targets

| Job | Target | Metrics |
|---|---|---|
| `skulcredit_api` | `api:8080/metrics` | HTTP request duration, request totals, active connections, login attempts, loan applications, user registrations |
| `rabbitmq` | `rabbitmq:15692/metrics` | Queue depth, message rates, dead-letter queues |
| `loki` | `loki:3100/metrics` | Log ingestion rate |
| `prometheus` | `localhost:9090` | Self-monitoring |

### Alert Rules (alerts.yml)

| Alert | Trigger | Severity |
|---|---|---|
| APIDown | API unreachable for 1 min | critical |
| HighErrorRate | 5xx rate > 5% over 5 min | warning |
| SlowResponseTime | p95 latency > 2s for 3 min | warning |
| RabbitMQDown | RabbitMQ unreachable for 1 min | critical |
| RabbitMQHighQueueDepth | Queue depth > 1000 for 5 min | warning |
| RabbitMQDeadLetterGrowing | DLQ messages > 10 for 5 min | warning |
| PostgreSQLDown | Postgres unreachable for 1 min | critical |
| RedisDown | Redis unreachable for 1 min | critical |
| ContainerHighMemory | Memory > 85% for 5 min | warning |
| ContainerRestarting | >3 restarts in 15 min | warning |

### Log Pipeline

```
API container stdout  ─► Promtail  ─► Loki  ─► Grafana
./logs/*.log (Winston) ─►    │
nginx/logs/*.log        ─────┘
```

Promtail uses Docker labels (`logging: promtail`, `logging_jobname: <name>`) to tag streams.

### Grafana

Available at `http://localhost:3000` (admin / `skulcredit_grafana`).

Provisioned dashboards are in `skulcredit-backend/docker/grafana/provisioning/dashboards/`.

---

## Seed Data

Run `docker compose exec api npx tsx scripts/seed.ts` to populate the database with:

- **Admin:** `admin@example.com` / `Admin@secure1`

All seeded accounts have `isEmailVerified: true` and `isActive: true`.

---

## License

See [LICENSE](skulcredit-backend/LICENSE).
