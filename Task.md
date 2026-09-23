
# TASK — Funding Partner / Disbursement Flow

So, once the parent has completed the repayment schedule and the application has gotten to the **funding/disbursement stage**, the next step is the funding partner.

The idea is that we don't want the funding partner to come into the main SkulCredit dashboard and start looking around for the application. We want to give them a **secure link to the specific transaction**.

So when the application is ready for funding, SkulCredit should generate a funding-partner link for that particular application.

That link is then sent to the funding partner **via email**.

The email should tell them that there is a funding request waiting for their review, and the link should take them directly to the transaction.

---

## What happens when the funding partner opens the link

When the funding partner clicks the link from their email, it should take them to a **Funding / Disbursement Review page**.

This page should show them the complete transaction details they need to make their decision.

Basically, I want the funding partner to be able to understand the entire journey of the applicant from that one page.

So they should see things like:

* Applicant/parent details
* Student details
* School name
* School account/payment details
* Tuition amount
* Service charge
* Total amount payable
* Repayment plan selected
* Number of repayment months
* Monthly repayment amount
* Repayment dates
* Application information
* Verification/KYC status
* Any other information that is relevant to their credit assessment

The idea is that **everything they need to check the transaction should be available on this page**.

They shouldn't have to go back and forth between different pages to understand what they are funding.

---

# Funding Partner Review

Now, the funding partner will do their own checks.

This is important because SkulCredit is not making the final credit decision for the funding partner.

The funding partner is going to look at the information we have provided and carry out whatever additional checks they require to determine whether they are comfortable funding the transaction.

So the page should have a clear status such as:

**Pending Funding Partner Review**

And then the funding partner can go through the transaction details.

Once they are satisfied that the applicant is eligible and creditworthy based on their own process, they can proceed with the disbursement.

---

# Disbursement

Once they decide to fund the application, they should have a clear action on the page:

**Proceed to Disbursement**

The funding partner then makes the actual payment to the **school's account** using the school banking details displayed on the transaction.

For example:

> **School:** Dothan Comprehensive Schools
> **Bank:** XXXXX Bank
> **Account Name:** Dothan Comprehensive Schools
> **Account Number:** XXXXXXXX
> **Amount to Disburse:** ₦450,000

The exact bank information should come from the application/school record and should be clearly displayed so that the funding partner knows exactly where the money is supposed to go.

---

# After the funding partner makes the transfer

This part is very important.

We should **not automatically mark the application as disbursed just because the funding partner opened the page or clicked "Proceed to Disbursement."**

The actual money has to be transferred first.

So after the funding partner has made the payment to the school account, they return to the transaction page.

There should then be an action like:

**Mark as Disbursed**

or

**Confirm Disbursement**

When they click that, we record that the funding partner has confirmed that the funds have been disbursed.

The transaction status then changes from something like:

**Pending Disbursement**

to:

**Disbursed**

---

# What happens on the parent side

This is where the two systems connect.

As soon as the funding partner confirms the disbursement, the parent's application status on the SkulCredit dashboard should automatically update.

The parent should now see the application as **GREEN / Funded / Disbursed**.

For example:

**Application Status**

🟢 **Funding Completed**

> Your school fees have been successfully funded and disbursed to your school.

The parent should also receive a notification by email.

Something like:

> **Your school fee funding has been completed**
>
> Your funding partner has successfully confirmed the disbursement of ₦450,000 to Dothan Comprehensive Schools.
>
> Your repayment schedule begins on [date].
>
> Next repayment: ₦112,500 on [date].

The same notification should also appear inside the parent's SkulCredit dashboard.

---

# The important part — status flow

I want us to think about this as a proper application state transition rather than just a button.

The flow should basically be:

**Parent completes repayment schedule**

↓

**Application ready for funding**

↓

**Funding partner link generated**

↓

**Email sent to funding partner**

↓

**Funding partner opens secure transaction link**

↓

**Funding partner reviews complete application**

↓

**Funding partner performs their own credit checks**

↓

**Funding partner approves/funds**

↓

**Funding partner disburses money to school account**

↓

**Funding partner returns to transaction page**

↓

**Funding partner clicks "Confirm Disbursement"**

↓

**SkulCredit records the disbursement**

↓

**Application status changes to GREEN / DISBURSED**

↓

**Parent receives email notification**

↓

**Parent dashboard updates**

↓

**Repayment schedule becomes active**

---

# We also need to handle the different statuses properly

I don't want this to be just a single "disbursed/not disbursed" field.

We should have clear states so that everyone knows exactly where the application is.

For example:

**Ready for Funding**

The parent has completed the required setup and the application is ready to be sent to a funding partner.

**Sent to Funding Partner**

The funding request has been generated and the funding partner has been notified.

**Under Funding Partner Review**

The funding partner has opened the transaction and is reviewing the application.

**Approved for Disbursement**

The funding partner has completed their checks and is ready to fund.

**Disbursement Pending**

The funding partner has approved the transaction but has not yet confirmed that the money has been transferred.

**Disbursed**

The funding partner has confirmed that the funds have been transferred to the school.

**Rejected / Declined**

If the funding partner decides not to fund the transaction, we should record that outcome and the reason where applicable.

---

# The link should be secure

The funding partner link is important because it contains sensitive financial and applicant information.

So this should not just be a normal public URL where somebody can change the application ID and see another person's transaction.

The link should be tied to the specific funding request and funding partner.

Ideally, the funding partner should be authenticated or the link should contain a secure, expiring token.

We should also record things like:

* When the link was generated
* When the email was sent
* When the funding partner opened the link
* When they started their review
* When they approved
* When they confirmed disbursement
* Who confirmed the disbursement
* Date and time of confirmation
* Amount disbursed
* Any rejection/decline reason

This gives us a proper audit trail.

---

# One more important thing

The **parent should not be able to mark the application as disbursed**.

Only the funding partner should be able to confirm that the money has actually been disbursed.

The parent can see the status, but the funding confirmation comes from the funding partner side.

So the parent experience is basically:

> **Waiting for Funding Partner**

then

> **Funding Partner Reviewing**

then

> **Funding Approved**

and finally:

> 🟢 **Funds Disbursed**

Once it gets to **Funds Disbursed**, the repayment schedule that the parent previously agreed to becomes the active repayment schedule.

---

# Overall idea

The way I want us to think about the system is:

**SkulCredit manages the application and repayment relationship.**

**The funding partner makes the funding/credit decision and disburses the money.**

So we're connecting both sides through this transaction.

The funding partner gets a **secure transaction link**, reviews the complete application, performs their own checks, sends the money directly to the school account, comes back to the same transaction page and confirms the disbursement.

Once they confirm it, **SkulCredit becomes the source of truth for the application's new status**, and the parent is automatically notified that their funding has been completed.

The repayment schedule the parent already set up should then remain attached to that application and move from **scheduled** to **active**, because funding has now actually happened.

---

## The simplest mental model

Think of it as three separate experiences:

**1. Parent**

`Set repayment schedule → Wait for funding → Get notified → Start repayment`

**2. Funding Partner**

`Receive email → Open transaction → Review applicant → Approve → Disburse to school → Confirm disbursement`

**3. SkulCredit**

`Create funding request → Track funding partner → Receive disbursement confirmation → Update application → Notify parent → Activate repayment`

That is the flow I want us to build.
