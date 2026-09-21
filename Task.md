TODO:

# Task 1

Any section in the parent UI that parent is require to select or provide school details and parent didnt not see the school of his/her child in our provided list of school, there should be an option for that parent to create or add the child school manully,
Input fields that should show when that action is click are:

- Name of the school
- contact of the any person in school -(must be active for verification) [email or phone number]
- school account details
- location of the school

# Task 2

in "parent/details" page

-- Tuition & repayment details

remove
Full payment option

we have two options,

1. 4 month
2. 3 month

# Task 3

in "parent/details" page
Application flow show .. in (Review) stage

- shows the tier of the school, percentage and services charges (this should be from backend because we have all the datils of register schools and non-register schools and their tier that each school before to.)

- All those details must be fetch from backend and display before you click submit.

# Task 4

in "parent/details" page

- Once parent click the submit button, everything is process in backend, system must send update school,
  If the school is registered school, send a link their emaill and the application details like
  {
  parent request : Requesting to pay child school fees
  parent name: Queen Mike
  term: First time
  seasion: 2026/20207
  student: James Mike
  Adminision number: TWQ242423
  School fees amount: N400,000.00
  }

so link will be sent to school email to verify the parent application details is correct along with the details, once the click link, it redirect them to pur platform in school portal, if the school is not logged-in before, the link redirect them to school login page and the link will still be pending on the url so that one logged-in it automatically redirect the school that parent application to verify, the see the details and see two buttons (accept or reject),
if the school accept, the status of the application will update in the backend and parent page, and notification will be send to be parent email and page notification regarding the update that his/her application status but when the school click when reject button, it ask the school to provide, explanation or why rejecting the application so skulcredit can follow up.

This is only applicable to registered school.

For none-register school we send a link and details of the parent of application to the school contact person in charge of communcation, which is why #Task1 was introduced.

For recap:
this is task1:

```
# Task 1
Any section in the parent UI that parent is require to select or provide school details and parent didnt not see the school of his/her child in our provided list of school, there should be an option for that parent to create or add the child school manully,
Input fields that should show when that action is click are:

- Name of the school
- contact of the any person in school -(must be active for verification) [email or phone number]
- school account details
- location of the school
```

# Task 5

in page http://localhost/parent/applications  
Timeline

we need add add more.

--so After "Decision", just below "Decision"

Add

1. "Pay service charge"
2. "setup repayment"

# Task 6

Once School Accept or confirm the parent application, nofitication will be send to parent email that Application has been accepted, he should complete the next stage of the application by clicking the button link.

The button link, has application id which will redirect a parent to a page where parent will pay for "Service Charge".
once parent complete this service charge task and it succesful, it redirect parent to "Setup Repayment Plan"

And once parent complete this too, system will send a link to funding partner --unilag or microfinance bank containing the parent, student, and school details and school bank details which the money will be send to.

the link we have call-to-action so when the funding partner make the tranfer and it successful, the success when ask them to click the "Disbument Complete or Rejected" button to parent get notification and skulcredit application will also get notified and the this call "Disbursed to school" status to update in the backend.

# Task 7

- when a parent repayment is overdue - constantly notify them using cronjob to check payment that is going due in days to remind them and when paymen is duel or overduel also send the parent constant reminder email like your repay is due day 1, day 2 etc.
- Note: this platform does not lay no interest rate due payment.
