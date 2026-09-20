Based on boss explanation, We need to work on Session/term.

for example we currently in 2026/2027 and every year has three term, (First term, Second Term and Third Term).

so we need to create a table for that also because parent need to also select term that are paying for.

start from 2026/2027 to 2035/2036, and remember every year has three term.
After that we update frontend to have "parent/details" to have seasion/terms selection. 
his explanation:
"
Okay so it depends on resumption date for each term so there is no need to have a static date.
What we will do is configure according to the term on each resumption period.
For instance, 1st term just resumed last monday - sept 14 2026. So assuming we were already set, we would have opened the parent portal as at September 1 and successful applications would have gotten a 4 month repayment period. Then anyone that applies in October, will get a 3 month repayment period.
After October, window closes till 2nd term which resumes in January 2027 with same pattern, early applicants get 4 months while February applicants get 3 months.
In 3rd term, repayment in 3 months bcos 3rd term is usually a short term unlike 1st and 2nd term.
"

so i created this
Generated Sessions & Terms Data (2026/2027 to 2035/2036)
The data includes pre-calculated estimated dates reflecting the logic where 1st Term and 2nd Term offer up to 4 months repayment (dropping to 3 months for late applicants), while 3rd Term strictly offers a maximum of 3 months due to the shorter term length.


{
  "academic_sessions": [
    {
      "session_id": "SESS-2026-2027",
      "session_name": "2026/2027",
      "start_year": 2026,
      "end_year": 2027,
      "is_current": true,
      "terms": [
        {
          "term_id": "TERM-2026-2027-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2026-09-14",
          "portal_opening_date": "2026-09-01",
          "status": "ACTIVE_APPLICATION",
          "application_windows": [
            {
              "window_name": "Early Applicant Window",
              "start_date": "2026-09-01",
              "end_date": "2026-09-30",
              "repayment_duration_months": 4,
              "is_open": true
            },
            {
              "window_name": "Late Applicant Window",
              "start_date": "2026-10-01",
              "end_date": "2026-10-31",
              "repayment_duration_months": 3,
              "is_open": false
            }
          ]
        },
        {
          "term_id": "TERM-2026-2027-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2027-01-11",
          "portal_opening_date": "2027-01-01",
          "status": "UPCOMING",
          "application_windows": [
            {
              "window_name": "Early Applicant Window",
              "start_date": "2027-01-01",
              "end_date": "2027-01-31",
              "repayment_duration_months": 4,
              "is_open": false
            },
            {
              "window_name": "Late Applicant Window",
              "start_date": "2027-02-01",
              "end_date": "2027-02-28",
              "repayment_duration_months": 3,
              "is_open": false
            }
          ]
        },
        {
          "term_id": "TERM-2026-2027-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2027-04-26",
          "portal_opening_date": "2027-04-01",
          "status": "UPCOMING",
          "application_windows": [
            {
              "window_name": "Standard Applicant Window",
              "start_date": "2027-04-01",
              "end_date": "2027-04-30",
              "repayment_duration_months": 3,
              "is_open": false
            },
            {
              "window_name": "Late Applicant Window",
              "start_date": "2027-05-01",
              "end_date": "2027-05-31",
              "repayment_duration_months": 2,
              "is_open": false
            }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2027-2028",
      "session_name": "2027/2028",
      "start_year": 2027,
      "end_year": 2028,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2027-2028-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2027-09-13",
          "portal_opening_date": "2027-09-01",
          "status": "UPCOMING",
          "application_windows": [
            {
              "window_name": "Early Applicant Window",
              "start_date": "2027-09-01",
              "end_date": "2027-09-30",
              "repayment_duration_months": 4,
              "is_open": false
            },
            {
              "window_name": "Late Applicant Window",
              "start_date": "2027-10-01",
              "end_date": "2027-10-31",
              "repayment_duration_months": 3,
              "is_open": false
            }
          ]
        },
        {
          "term_id": "TERM-2027-2028-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2028-01-10",
          "portal_opening_date": "2028-01-01",
          "status": "UPCOMING",
          "application_windows": [
            {
              "window_name": "Early Applicant Window",
              "start_date": "2028-01-01",
              "end_date": "2028-01-31",
              "repayment_duration_months": 4,
              "is_open": false
            },
            {
              "window_name": "Late Applicant Window",
              "start_date": "2028-02-01",
              "end_date": "2028-02-29",
              "repayment_duration_months": 3,
              "is_open": false
            }
          ]
        },
        {
          "term_id": "TERM-2027-2028-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2028-04-24",
          "portal_opening_date": "2028-04-01",
          "status": "UPCOMING",
          "application_windows": [
            {
              "window_name": "Standard Applicant Window",
              "start_date": "2028-04-01",
              "end_date": "2028-04-30",
              "repayment_duration_months": 3,
              "is_open": false
            },
            {
              "window_name": "Late Applicant Window",
              "start_date": "2028-05-01",
              "end_date": "2028-05-31",
              "repayment_duration_months": 2,
              "is_open": false
            }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2028-2029",
      "session_name": "2028/2029",
      "start_year": 2028,
      "end_year": 2029,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2028-2029-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2028-09-11",
          "portal_opening_date": "2028-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2028-09-01", "end_date": "2028-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2028-10-01", "end_date": "2028-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2028-2029-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2029-01-08",
          "portal_opening_date": "2029-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2029-01-01", "end_date": "2029-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2029-02-01", "end_date": "2029-02-28", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2028-2029-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2029-04-23",
          "portal_opening_date": "2029-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2029-04-01", "end_date": "2029-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2029-05-01", "end_date": "2029-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2029-2030",
      "session_name": "2029/2030",
      "start_year": 2029,
      "end_year": 2030,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2029-2030-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2029-09-10",
          "portal_opening_date": "2029-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2029-09-01", "end_date": "2029-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2029-10-01", "end_date": "2029-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2029-2030-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2030-01-07",
          "portal_opening_date": "2030-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2030-01-01", "end_date": "2030-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2030-02-01", "end_date": "2030-02-28", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2029-2030-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2030-04-22",
          "portal_opening_date": "2030-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2030-04-01", "end_date": "2030-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2030-05-01", "end_date": "2030-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2030-2031",
      "session_name": "2030/2031",
      "start_year": 2030,
      "end_year": 2031,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2030-2031-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2030-09-09",
          "portal_opening_date": "2030-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2030-09-01", "end_date": "2030-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2030-10-01", "end_date": "2030-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2030-2031-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2031-01-06",
          "portal_opening_date": "2031-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2031-01-01", "end_date": "2031-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2031-02-01", "end_date": "2031-02-28", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2030-2031-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2031-04-28",
          "portal_opening_date": "2031-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2031-04-01", "end_date": "2031-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2031-05-01", "end_date": "2031-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2031-2032",
      "session_name": "2031/2032",
      "start_year": 2031,
      "end_year": 2032,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2031-2032-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2031-09-15",
          "portal_opening_date": "2031-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2031-09-01", "end_date": "2031-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2031-10-01", "end_date": "2031-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2031-2032-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2032-01-12",
          "portal_opening_date": "2032-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2032-01-01", "end_date": "2032-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2032-02-01", "end_date": "2032-02-29", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2031-2032-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2032-04-26",
          "portal_opening_date": "2032-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2032-04-01", "end_date": "2032-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2032-05-01", "end_date": "2032-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2032-2033",
      "session_name": "2032/2033",
      "start_year": 2032,
      "end_year": 2033,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2032-2033-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2032-09-13",
          "portal_opening_date": "2032-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2032-09-01", "end_date": "2032-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2032-10-01", "end_date": "2032-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2032-2033-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2033-01-10",
          "portal_opening_date": "2033-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2033-01-01", "end_date": "2033-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2033-02-01", "end_date": "2033-02-28", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2032-2033-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2033-04-25",
          "portal_opening_date": "2033-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2033-04-01", "end_date": "2033-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2033-05-01", "end_date": "2033-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2033-2034",
      "session_name": "2033/2034",
      "start_year": 2033,
      "end_year": 2034,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2033-2034-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2033-09-12",
          "portal_opening_date": "2033-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2033-09-01", "end_date": "2033-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2033-10-01", "end_date": "2033-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2033-2034-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2034-01-09",
          "portal_opening_date": "2034-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2034-01-01", "end_date": "2034-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2034-02-01", "end_date": "2034-02-28", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2033-2034-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2034-04-24",
          "portal_opening_date": "2034-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2034-04-01", "end_date": "2034-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2034-05-01", "end_date": "2034-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2034-2035",
      "session_name": "2034/2035",
      "start_year": 2034,
      "end_year": 2035,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2034-2035-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2034-09-11",
          "portal_opening_date": "2034-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2034-09-01", "end_date": "2034-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2034-10-01", "end_date": "2034-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2034-2035-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2035-01-08",
          "portal_opening_date": "2035-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2035-01-01", "end_date": "2035-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2035-02-01", "end_date": "2035-02-28", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2034-2035-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2035-04-23",
          "portal_opening_date": "2035-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2035-04-01", "end_date": "2035-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2035-05-01", "end_date": "2035-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    },
    {
      "session_id": "SESS-2035-2036",
      "session_name": "2035/2036",
      "start_year": 2035,
      "end_year": 2036,
      "is_current": false,
      "terms": [
        {
          "term_id": "TERM-2035-2036-T1",
          "term_code": "FIRST_TERM",
          "term_name": "First Term",
          "default_resumption_month": "September",
          "max_repayment_months": 4,
          "resumption_date": "2035-09-10",
          "portal_opening_date": "2035-09-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2035-09-01", "end_date": "2035-09-30", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2035-10-01", "end_date": "2035-10-31", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2035-2036-T2",
          "term_code": "SECOND_TERM",
          "term_name": "Second Term",
          "default_resumption_month": "January",
          "max_repayment_months": 4,
          "resumption_date": "2036-01-07",
          "portal_opening_date": "2036-01-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Early Applicant Window", "start_date": "2036-01-01", "end_date": "2036-01-31", "repayment_duration_months": 4, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2036-02-01", "end_date": "2036-02-29", "repayment_duration_months": 3, "is_open": false }
          ]
        },
        {
          "term_id": "TERM-2035-2036-T3",
          "term_code": "THIRD_TERM",
          "term_name": "Third Term",
          "default_resumption_month": "April",
          "max_repayment_months": 3,
          "resumption_date": "2036-04-28",
          "portal_opening_date": "2036-04-01",
          "status": "UPCOMING",
          "application_windows": [
            { "window_name": "Standard Applicant Window", "start_date": "2036-04-01", "end_date": "2036-04-30", "repayment_duration_months": 3, "is_open": false },
            { "window_name": "Late Applicant Window", "start_date": "2036-05-01", "end_date": "2036-05-31", "repayment_duration_months": 2, "is_open": false }
          ]
        }
      ]
    }
  ]
}


We also need to update our parent application to look like this json flow. so i created this a clean JSON database structure and seeding dataset designed to handle sessions, terms, repayment windows, and payment tracking from the 2026/2027 session through 2035/2036.

We just need to update adding things that are not current in our parent application flow, including the ledger.

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SchoolAcademicAndPaymentSystem",
  "definitions": {
    "TermConfiguration": {
      "type": "object",
      "properties": {
        "term_id": { "type": "string" },
        "term_code": { "type": "string", "enum": ["FIRST_TERM", "SECOND_TERM", "THIRD_TERM"] },
        "term_name": { "type": "string" },
        "default_resumption_month": { "type": "string" },
        "max_repayment_months": { "type": "integer" },
        "resumption_date": { "type": ["string", "null"], "format": "date" },
        "portal_opening_date": { "type": ["string", "null"], "format": "date" },
        "status": { "type": "string", "enum": ["UPCOMING", "ACTIVE_APPLICATION", "APPLICATION_CLOSED", "COMPLETED"] },
        "application_windows": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "window_name": { "type": "string" },
              "start_date": { "type": "string", "format": "date" },
              "end_date": { "type": "string", "format": "date" },
              "repayment_duration_months": { "type": "integer" },
              "is_open": { "type": "boolean" }
            },
            "required": ["window_name", "start_date", "end_date", "repayment_duration_months", "is_open"]
          }
        }
      },
      "required": ["term_id", "term_code", "term_name", "max_repayment_months", "status", "application_windows"]
    },
    "AcademicSession": {
      "type": "object",
      "properties": {
        "session_id": { "type": "string" },
        "session_name": { "type": "string", "pattern": "^\\d{4}/\\d{4}$" },
        "start_year": { "type": "integer" },
        "end_year": { "type": "integer" },
        "is_current": { "type": "boolean" },
        "terms": {
          "type": "array",
          "items": { "$ref": "#/definitions/TermConfiguration" },
          "minItems": 3,
          "maxItems": 3
        }
      },
      "required": ["session_id", "session_name", "start_year", "end_year", "is_current", "terms"]
    }
  }
}