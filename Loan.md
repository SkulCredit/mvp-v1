POST
Book Loan
https://adjutor.lendsqr.com/v2/customers/loans
Book a loan using the details of the customer.

Request Payload
bvn * ˢᵗʳⁱⁿᵍ
11-digit Bank Verification Number.

requested_amount * ⁱⁿᵗᵉᵍᵉʳ
Loan amount requested.

proposed_tenor * ⁱⁿᵗᵉᵍᵉʳ
Duration of the loan.

proposed_tenor_period ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Period unit for the tenor (days, weeks, months).

purpose ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Reason for requesting the loan (e.g., "Home renovation").

marital_status ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Marital status
Values supported: Single, Married, Divorced, Widowed, Separated

no_of_dependent ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Number of dependents (e.g., 0, 1, 2, etc).

type_of_residence ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Type of residence
Values supported: Own House, Parents Apartment, Rented Apartment

educational_attainment ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Highest level of education
Values supported: BSc, HND and Other Equivalents, Undergraduate, Others, Diploma/School Cert, MSc and Above

sector_of_employment ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Industry of employment
Values supported: _Agriculture, Banking, Education, Healthcare, Hospitality and Events, Information Technology, Law, Manufacturing and Construction, Media & Entertainment, NGO, Oil and Gas, Other Financial, Others: Public services and administration, Telecoms, Tourism & Hospitality,_Transportation & Logistics, Wholesale and Retail Trade

monthly_net_income ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Monthly take-home salary.

proposed_payday ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Proposed loan repayment start date (YYYY-MM-DD).

employment_status ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Current employment status
Values supported: Employed, Self Employed, Unemployed

work_start_date ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Date employment started (YYYY-MM-DD).

work_email ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Work email address. Can be an empty string.

current_employer ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Name of the current employer.

employment_category ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Type of employment (Artisan, Private Company, Public, etc.).

product_id * ⁱⁿᵗᵉᵍᵉʳ
ID of the loan product being applied for.

disburse_to ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Where the loan should be disbursed (bank, wallet, third-party, restrictedd-wallet).
Defaults to bank.
Learn more

location ⁿᵘˡˡᵃᵇˡᵉ ˢᵗʳⁱⁿᵍ
Borrower’s location (e.g., "Lagos"). Can be an empty string.



curl --location 'https://adjutor.lendsqr.com/v2/customers/loans' \
--data-raw '{
    "bvn": "22222222222",
    "requested_amount": 300,
    "proposed_tenor": 12,
    "proposed_tenor_period": "months",
    "purpose": "Home renovation",
    "marital_status": "Single",
    "no_of_dependent": "2",
    "type_of_residence": "Rented Apartment",
    "educational_attainment": "Undergraduate",
    "sector_of_employment": "Other Financial",
    "monthly_net_income": "100000",
    "proposed_payday": "2024-08-30",
    "employment_status": "Employed",
    "work_start_date": "2022-01-15",
    "work_email": "user@company.com",
    "current_employer": "Company Inc.",
    "employment_category": "Private Company",
    "product_id": 74,
    "disburse_to": "bank",
    "location": "Lagos"
}'

response

{
  "status": "success",
  "message": "Successful",
  "data": {
    "loan_id": 258071,
    "loan_profile_id": 2962519
  },
  "meta": {
    "cost": 0,
    "balance": 1240
  }
}