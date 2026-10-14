# GitHub Actions — Required Secrets & Configuration

This document lists every secret and variable the CI/CD workflows need.
Configure them under **Settings → Secrets and variables → Actions** in your
GitHub repository, grouped by environment.

---

## Repository-level secrets (used by both CI and CD)

These are not environment-specific and are available to all workflows.

| Secret | Description |
|---|---|
| _(none required at repo level — GITHUB_TOKEN is automatic)_ | |

> `GITHUB_TOKEN` is injected automatically by GitHub. It is used to push
> images to GHCR (`ghcr.io`) and requires no manual configuration.

---

## Environment secrets

Create **two environments** in Settings → Environments:

- `production`
- `staging` *(optional — mirrors production with different values)*

All secrets below must be added to **each environment** separately.

---

### Server access

| Secret | Example / Notes |
|---|---|
| `SSH_PRIVATE_KEY` | Private key (PEM) whose public half is in `~/.ssh/authorized_keys` on the server. Generate with `ssh-keygen -t ed25519 -C "github-actions"`. |
| `SERVER_HOST` | IP address or hostname of the target server, e.g. `203.0.113.10` |
| `SERVER_USER` | SSH username on the server, e.g. `ubuntu` or `deploy` |
| `DEPLOY_PATH` | Absolute path on the server where the repo is deployed, e.g. `/srv/skulcredit` |

---

### Application

| Secret | Example / Notes |
|---|---|
| `APP_URL` | Public base URL, e.g. `https://skulcredit.com` — used for smoke test and CORS |
| `FRONTEND_URL` | Frontend origin, e.g. `https://skulcredit.com` |

---

### Database (PostgreSQL)

| Secret | Example / Notes |
|---|---|
| `DATABASE_URL` | Full connection string: `postgresql://user:pass@postgres:5432/skulcredit` |
| `DB_NAME` | Database name, e.g. `skulcredit` |
| `DB_USER` | Database user, e.g. `skulcredit_app` |
| `DB_PASSWORD` | Strong random password — never reuse dev values in production |

---

### Auth (JWT)

| Secret | Notes |
|---|---|
| `JWT_SECRET` | ≥ 64 random bytes, base64-encoded. Generate: `openssl rand -base64 64` |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h` |
| `JWT_REFRESH_SECRET` | Separate secret from `JWT_SECRET`. Generate the same way. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime, e.g. `7d` |

---

### Infrastructure

| Secret | Example / Notes |
|---|---|
| `RABBITMQ_PASSWORD` | Password for the `skulcredit` RabbitMQ user |
| `REDIS_URL` | `redis://redis:6379` — override only if using an external Redis (e.g. Upstash) |

---

### Third-party integrations

| Secret | Notes |
|---|---|
| `LENDSQR_API_KEY` | Adjutor/Lendsqr live API key |
| `LENDSQR_BASE_URL` | `https://adjutor.lendsqr.com` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_live_…`) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (`pk_live_…`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP host, e.g. `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port, e.g. `587` |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password or app-specific password |
| `FUNDING_PARTNER_EMAIL` | Email used for funding partner notifications |
| `FUNDING_PARTNER_NAME` | Display name for funding partner emails |

---

### Observability

| Secret | Notes |
|---|---|
| `GRAFANA_USER` | Grafana admin username |
| `GRAFANA_PASSWORD` | Grafana admin password |

---

### Notifications (optional)

| Secret | Notes |
|---|---|
| `SLACK_WEBHOOK_URL` | Incoming Webhook URL for deploy-failure alerts. If omitted the Slack step is skipped gracefully (`continue-on-error: true`). Create one at https://api.slack.com/messaging/webhooks |

---

## Workflow dispatch inputs (not secrets)

The CD workflow (`cd.yml`) also accepts these runtime inputs via
**Actions → Run workflow**:

| Input | Default | Description |
|---|---|---|
| `environment` | `production` | Target environment (`production` or `staging`) |
| `api_replicas` | `2` | Number of API container replicas to run behind the load balancer |

---

## Quick-start checklist

```
[ ] Create 'production' environment in GitHub Settings → Environments
[ ] Add all secrets listed above to the 'production' environment
[ ] Generate an SSH key pair and add the public key to the server's authorized_keys
[ ] Ensure the server has Docker + Docker Compose v2 installed
[ ] Confirm DEPLOY_PATH directory exists on the server and is owned by SERVER_USER
[ ] (Optional) Create 'staging' environment and mirror all secrets with staging values
[ ] (Optional) Add SLACK_WEBHOOK_URL for deploy failure alerts
[ ] Push to main and watch the CD workflow run under Actions
```

---

## Security notes

- Never commit real secret values to the repository. All values above belong
  exclusively in GitHub Secrets.
- Use a dedicated deploy user (`deploy`, `ci`) on the server — not `root`.
- Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` independently; rotating them
  invalidates all active sessions.
- The `GITHUB_TOKEN` permission in `cd.yml` is scoped to `packages: write`
  only — it cannot access repository secrets or modify settings.
