# Lendsqr Adjutor API — SkulCredit Integration Reference

Base URL: `https://adjutor.lendsqr.com`  
Auth header on every request: `Authorization: Bearer YOUR_API_KEY`  
Content-Type: `application/json`

---

## Why we use Adjutor

SkulCredit is a school-fee financing platform. Parents apply for loans; Lendsqr Adjutor handles three things for us:

1. **Identity / KYC** — verify BVN so we know the parent is real before lending
2. **Customer registration** — create a Lendsqr customer record tied to that BVN so loan products can be offered to them
3. **Loan booking** — submit the approved loan application to Lendsqr for disbursement to the school

---

## Endpoints we need — in order of the user journey

---

### 1. Verify BVN (Identity)

**When:** Parent submits KYC — `POST /api/v1/parents/kyc`  
**Why:** We must confirm the BVN is valid and belongs to the parent before creating a Lendsqr customer record.

> Find this under: **Beta or Experimental APIs → Utilities → BVN Verification** (or Identity section)

**What to look for:**

- Endpoint URL
- Required fields: `bvn` (11-digit string)
- Whether it also needs: `dob`, `phone_number`, `first_name`, `last_name`
- Response shape: what field confirms a successful match (e.g. `status: "successful"`)

**Used in:** `src/integrations/lendsqr/identity.service.ts → verifyBvn(bvn)`

---

### 2. Create Customer

**When:** Immediately after BVN is verified — same `POST /api/v1/parents/kyc` call  
**Why:** Creates the Lendsqr customer record we need before we can score or book a loan. We store the returned customer `id` as `lendsqrCustomerId` on the Parent record.

> Find this under: **Beta or Experimental APIs → Customers → Create new Customer**

**Endpoint:** `POST /v2/customers`

**What we send (map from our Parent data):**

| Lendsqr field      | Our source                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| `phone_number`     | `user.phoneNumber`                                                                |
| `bvn`              | from KYC form                                                                     |
| `bvn_phone_number` | `user.phoneNumber` (same number registered with BVN)                              |
| `dob`              | `parent.dob` (YYYY-MM-DD)                                                         |
| `email`            | `user.email`                                                                      |
| `account_number`   | need to collect from parent — not in our schema yet                               |
| `bank_code`        | need to collect from parent — not in our schema yet                               |
| `city`             | `parent.addressCity`                                                              |
| `address`          | `parent.addressStreet`                                                            |
| `photo_url`        | `parent.profilePhotoUrl`                                                          |
| `documents`        | array — at minimum a NIN/Voter card (type_id + sub_type_id + url from Cloudinary) |

**What to look for:**

- Full list of required vs optional fields
- `documents` array structure (type_id, sub_type_id values for NIN / National ID Card)
- Response: where is the customer `id` returned (e.g. `data.users[0].id`)

**Used in:** `src/integrations/lendsqr/customer.service.ts → createCustomer()`

**Gap to fix:** Our KYC flow currently only collects `bvn` and `nin`. We need to also collect `account_number`, `bank_code`, and confirm we have `dob` and a `photo_url` before calling this endpoint. Update `verifyKycSchema` in `parent.validator.ts` once you have the full required fields confirmed.

---

### 3. Get Loan Products

**When:** Before showing the eligibility/apply page — `GET /api/v1/loans/eligibility` or a new `GET /api/v1/loans/products` endpoint  
**Why:** We need to know what `product_id` values are available and their names/limits so we can show the parent valid loan options and pass the correct `product_id` when scoring or booking.

> Find this under: **Beta or Experimental APIs → Loans → Get Loan Products**

**What to look for:**

- Endpoint URL (likely `GET /v2/loans/products`)
- Response shape: does it return an array of products, what fields does each product have (id, name, min/max amount, interest rate, available tenors)
- Whether it requires a customer_id parameter or is a general org-level listing

**Used in:** new `src/integrations/lendsqr/application.service.ts → getLoanProducts()`  
We will add `GET /api/v1/loans/products` route so the frontend can populate the loan product selector.

---

### 4. Score Loan (Eligibility Check)

**When:** Parent submits eligibility check — `POST /api/v1/loans/eligibility`  
**Why:** Runs Lendsqr's credit scoring engine against the parent's profile before letting them book a loan. Returns a decision (approve/decline) and the scored limit.

> Find this under: **Beta or Experimental APIs → Loans → Score Loan**

**What to look for:**

- Endpoint URL (likely `POST /v2/loans/score`)
- Full request payload — our current validator only sends `amount`. We expect it needs:
  - `product_id` (integer)
  - `bvn` or customer identifier
  - borrower attributes: `monthly_net_income`, `employment_status`, `loan_amount`, `location`, etc.
- Response shape: what field holds the decision (`approved`/`declined`), scored limit, reason

**What we currently send (wrong):**

```json
{ "customer_id": "abc", "amount": 200000 }
```

**What we need to send (placeholder — fill from docs):**

```json
{
  "product_id": <from Get Loan Products>,
  "bvn": "22222222222",
  "requested_amount": 200000,
  "monthly_net_income": "<from parent profile>",
  "employment_status": "<from parent profile>",
  "location": "<parent.addressCity>"
}
```

**Used in:** `src/integrations/lendsqr/application.service.ts → checkEligibility()`  
`src/services/loan.service.ts → checkEligibility()`

**Gap to fix:** Parent profile has no `employment_status`, `monthly_net_income`, or `sector_of_employment` fields yet. We need to add these to the `completeProfileSchema` and the Parent model/DB table, because Lendsqr needs them at scoring time.

---

### 5. Book Loan

**When:** Parent confirms and submits application — `POST /api/v1/loans/apply`  
**Why:** Creates the actual loan on Lendsqr's side. Returns a `loan_id` we store as `lendsqrApplicationId` on our `LoanApplication` record.

> Find this under: **Beta or Experimental APIs → Loans → Book Loan**

**Endpoint:** `POST /v2/customers/loans`  
**Documented in:** `Loan.md` in this repo — full payload already known.

**What we send (map from our data):**

| Lendsqr field           | Our source                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `bvn`                   | `parent.bvn`                                               |
| `requested_amount`      | `req.body.amount`                                          |
| `proposed_tenor`        | `req.body.tenor`                                           |
| `proposed_tenor_period` | `"months"` (hardcoded)                                     |
| `purpose`               | `"School Fees for {student.firstName} {student.lastName}"` |
| `product_id`            | need from Get Loan Products step                           |
| `disburse_to`           | `"bank"` (disbursed to school's bank account)              |
| `location`              | `parent.addressCity`                                       |
| `monthly_net_income`    | `parent.monthlyNetIncome` (field to add)                   |
| `employment_status`     | `parent.employmentStatus` (field to add)                   |
| `marital_status`        | `parent.maritalStatus` (field to add — optional)           |

**Response:** `data.loan_id` and `data.loan_profile_id` — store `loan_id` as `lendsqrApplicationId`.

**Used in:** `src/integrations/lendsqr/application.service.ts → submitApplication()`  
`src/services/loan.service.ts → submitApplication()`

---

### 6. Get Customer Loan (Status Polling)

**When:** Admin or parent checks status of a submitted loan  
**Why:** Our `LoanApplication` status is updated by school verification and admin approval internally, but for loans already on Lendsqr's side we may need to sync the disbursement status.

> Find this under: **Beta or Experimental APIs → Loans → Get Customer Loan**

**What to look for:**

- Endpoint URL (likely `GET /v2/customers/loans/{loan_id}`)
- Response fields for status, disbursement date, outstanding balance

**Used in:** `src/integrations/lendsqr/application.service.ts → getApplicationStatus()`

---

## Summary — what to copy from the Adjutor docs

When you log in, find and paste the exact endpoint URL, full request payload (required + optional fields), and full response shape for each of these:

| #   | Section in Adjutor docs         | Status                                                                          |
| --- | ------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Utilities → BVN Verification    | need URL + response                                                             |
| 2   | Customers → Create new Customer | URL known (`POST /v2/customers`), need full required fields + document type_ids |
| 3   | Loans → Get Loan Products       | need URL + response shape                                                       |
| 4   | Loans → Score Loan              | need URL + full payload + response (decision field name)                        |
| 5   | Loans → Book Loan               | fully documented in `Loan.md` ✓                                                 |
| 6   | Loans → Get Customer Loan       | need URL + response (status field name)                                         |

---

## Parent profile fields we still need to add

These fields are required by Lendsqr at KYC and loan scoring time but don't exist in our Parent model yet. Confirm exactly what Lendsqr accepts, then we'll add them to:

- `Parent` Sequelize model + migration
- `completeProfileSchema` in `parent.validator.ts`
- Profile completion UI in the frontend

| Field                   | Required for           | Lendsqr field name       |
| ----------------------- | ---------------------- | ------------------------ |
| `accountNumber`         | Create Customer        | `account_number`         |
| `bankCode`              | Create Customer        | `bank_code`              |
| `employmentStatus`      | Score Loan + Book Loan | `employment_status`      |
| `monthlyNetIncome`      | Score Loan + Book Loan | `monthly_net_income`     |
| `sectorOfEmployment`    | Book Loan (optional)   | `sector_of_employment`   |
| `maritalStatus`         | Book Loan (optional)   | `marital_status`         |
| `educationalAttainment` | Book Loan (optional)   | `educational_attainment` |
| `typeOfResidence`       | Book Loan (optional)   | `type_of_residence`      |
| `noOfDependents`        | Book Loan (optional)   | `no_of_dependent`        |
| `currentEmployer`       | Book Loan (optional)   | `current_employer`       |
| `workEmail`             | Book Loan (optional)   | `work_email`             |
| `workStartDate`         | Book Loan (optional)   | `work_start_date`        |
