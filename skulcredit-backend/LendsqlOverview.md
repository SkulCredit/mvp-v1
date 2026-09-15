Let me first look at your current codebase to understand what's already built, then analyze the Lendsqr feature list against your SkulCredit requirements.Now let me check the Adjutor/Lendsqr API documentation to confirm the exact available endpoints:Good — now I have a comprehensive picture. Let me compile the full analysis.

---

Here's a thorough breakdown of where Adjutor (Lendsqr's API service) fits into SkulCredit, where it covers you, and where it doesn't.

---

## What Adjutor Actually Is

Adjutor is **not** a full loan management system for your use case. It's a suite of **data and decisioning APIs** — identity, fraud screening, credit bureau, and direct debit. You're building SkulCredit's own loan lifecycle on top of it. That's the right approach given your two-sided model (parent + school), which Lendsqr's platform itself doesn't natively model.

---

## Area-by-Area Coverage Analysis

### ✅ Areas Where Adjutor Covers You

**1. BVN Verification (Identity)**
Adjutor's `GET /v2/verification/bvn/{bvn}` returns name, date of birth, and match data against the submitted profile. You've already wired this. The `bvn-with-image` variant adds photo matching for stronger identity confidence, useful for reducing manual review.

**2. NIN Verification**
`GET /v2/verification/nin/{nin}` — the endpoint is defined in your `identity.service.js` but never called. This is a straightforward gap to close. The PRD requires at least one of BVN or NIN, so NIN must flow through the same verification + profile-match logic as BVN.

**3. Karma / Watchlist Screening**
`GET /v1/karma/{identity}` — checks whether a customer is on Lendsqr's shared blacklist of defaulters across its lender network. This is critical for your underwriting and your PRD's fraud review requirement. You need this called during KYC and again at loan application submission, before any offer is generated. Currently not wired at all.

**4. Bank Account Name Lookup (School Verification)**
`GET /v1/verification/bank-account` — validates a bank account number and returns the registered account name. Your PRD explicitly requires automatic account-name validation against the registered school name before disbursement can be enabled. Your `PUT /schools/bank-details` endpoint notes this as missing. This is a P1 gap.

**5. Credit Bureau Checks**
Adjutor provides access to FirstCentral, CRC, and CreditRegistry via BVN. This feeds your manual underwriting view and the "existing credit obligations" check your underwriting rules require. The feature list confirms this at the Pro tier and above.

**6. Oraculi Borrower Scoring**
Adjutor's scoring endpoint lets you submit borrower data and receive a score that can feed your automated approval/rejection logic. This is how you implement the "automated approval threshold vs. manual review" decision your PRD requires, without building a scoring model from scratch.

**7. Direct Debit / Mandate**
Adjutor provides tokenized bank access, mandate creation, and automated repayment collection — including partial-balance debiting. This maps directly to your Autopay/Direct Debit Setup use case. However, note the pricing: `₦200 + 2%` capped at `₦2,500` per repayment — which at school fee loan sizes you need to model into your cost structure.

---

### ⚠️ Areas Where Adjutor Partially Covers You

**8. Customer Management**
`POST /v1/customers`, `GET /v1/customers/{id}`, `PUT /v1/customers/{id}` exist and you've wired `createCustomer`. The `lendsqrCustomerId` is already stored on your `Parent` model. What's missing is calling `GET /v1/customers/{id}/credit-bureau` to pull the credit report at underwriting time, and `GET /v1/customers/{id}/loans` to check existing Lendsqr-originated obligations. These need to be called at underwriting, not just at onboarding.

**9. Loan Eligibility / Application**
Your `application.service.js` has `checkEligibility` and `submitApplication` wired but the paths and payloads are unverified against the actual Adjutor spec. More importantly: Adjutor's loan APIs are designed for Adjutor-managed loans, not SkulCredit's custom three-party flow (parent → SkulCredit → school disbursement). You likely want to use Adjutor for **scoring and bureau data inputs** to your underwriting decision, but manage the loan record, repayment schedule, and disbursement entirely in your own database. Relying on Adjutor to own the loan lifecycle would mean Adjutor doesn't know about schools, terms, or the two-step disbursement trigger.

---

### ❌ Areas Adjutor Does Not Cover — You Build These

**10. School Two-Sided Model**
Adjutor has no concept of schools, partner onboarding, enrollment verification, or school-directed disbursement. Everything in your School Portal — KYB review, fee schedules, enrollment confirmation, the disbursement trigger requiring school sign-off — is entirely custom.

**11. Repayment Schedules and Loan Lifecycle**
Your `RepaymentSchedule`, `Repayment`, and `Disbursement` models are missing and must be built in-house. Adjutor can *collect* repayments via direct debit mandate, but it doesn't generate or own the installment schedule aligned to your term/semester structure and lending policy.

**12. Disbursement to Schools (Bank Transfer)**
Funds go to the school's bank account, not the borrower. Adjutor's direct debit handles *inbound* collection from parents. Outbound school disbursement needs **Paystack Transfers API** (or Flutterwave). Adjutor does not disburse to third parties.

**13. Application Tracking & Status Lifecycle**
The 9-state loan application lifecycle (`submitted → under_review → approved → school_verification → disbursed`, etc.) is your own domain logic, managed via `ApplicationEvent`. Adjutor has no awareness of this.

**14. Mono (Bank Statement / Income Analysis)**
Financial verification — linking a bank account and retrieving 6–12 months of transaction history for income and affordability assessment — is entirely Mono's responsibility. Adjutor does not do this.

**15. SMS Notifications**
OTP delivery and payment reminders via SMS (Termii / Africa's Talking) are not part of Adjutor. Currently all your notifications are email-only.

**16. School Staff & Roles, Audit Logs, Compliance Records**
Completely custom. No Adjutor coverage.

**17. Reports, Analytics, Portfolio Dashboards**
Entirely your own aggregation logic over your database. Adjutor doesn't provide portfolio reporting.

---

## Summary Table

| SkulCredit Need | Adjutor Covers? | Tool |
|---|---|---|
| BVN verification + name/DOB match | ✅ Yes | Adjutor |
| NIN verification | ✅ Yes (not wired) | Adjutor |
| Karma / blacklist screening | ✅ Yes (not wired) | Adjutor |
| School bank account name lookup | ✅ Yes (not wired) | Adjutor |
| Credit bureau check at underwriting | ✅ Yes (not wired) | Adjutor |
| Borrower credit scoring (Oraculi) | ✅ Yes (not wired) | Adjutor |
| Direct debit mandate for repayment collection | ✅ Yes (not wired) | Adjutor |
| Customer record management | ⚠️ Partial | Adjutor + your DB |
| Bank statement / income analysis | ❌ No | Mono |
| School disbursement (outbound bank transfer) | ❌ No | Paystack Transfers |
| Repayment schedule generation | ❌ No | Your business logic |
| Loan lifecycle (status transitions, events) | ❌ No | Your app |
| School onboarding, KYB, enrollment verification | ❌ No | Your app |
| Notifications (SMS, email, in-app) | ❌ No | Termii / Nodemailer |
| Audit logs, compliance records | ❌ No | Your app |
| Portfolio analytics and reporting | ❌ No | Your app |

---

## Key Recommendation

The most impactful unwired Adjutor calls to prioritize are:

1. **Karma check** — must run at KYC completion and again at loan submission. A parent on the blacklist should not receive an offer.
2. **Bank account name lookup** — unblocks school disbursement entirely. Nothing can disburse until this is live.
3. **NIN verification** — the PRD requires at least one of BVN/NIN; right now NIN is accepted and stored but never actually verified.
4. **Credit bureau at underwriting** — needed before the manual underwriting view in the admin portal can be meaningful.