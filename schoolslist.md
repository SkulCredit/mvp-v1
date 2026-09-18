So in the parent dashboard ui we have "parent/eligibility" page and this form, we have "Institution Type", "Choose Student School" and "Class/Level".
so i think we need to create table for this data. this data should be inserted by default when application run first time, if the applications runs again-skip inserting data into the db.
Now all these "Institution Type", "Choose Student School" and "Class/Level" dependent selection fields.
"Choose Student School" depend on what parent select in "Institution Type" and "Class/Level" depend on what parent select in "Choose Student School".

so to solve this problem, we need to create endpoints for each, first fetch all "Institution Type", and base on the selection- fetch "Student School" and base on that selection fetch "Class/Level".

so this are all data i gather so far, i use json so you can understand when creating table model or table and please you index, foriegn key so we easily fetch related data.

These are the schools we already have and their details.

{
"institution_name": "Gulf Flower Schools",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Pre-age 1",
"Pre-age 2",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
},
{
"type": "Secondary",
"sub_levels": [
{
"level": "Junior Secondary",
"classes": [
"JSS 1 (Basic 7)",
"JSS 2 (Basic 8)",
"JSS 3 (Basic 9)"
]
},
{
"level": "Senior Secondary",
"classes": [
"SSS 1",
"SSS 2",
"SSS 3"
]
}
]
}
]
}

{
"institution_name": "Foster Prime Schools",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Toddler",
"Playgroup",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
},
{
"type": "Secondary",
"sub_levels": [
{
"level": "Junior Secondary",
"classes": [
"JSS 1 (Basic 7)",
"JSS 2 (Basic 8)",
"JSS 3 (Basic 9)"
]
},
{
"level": "Senior Secondary",
"classes": [
"SSS 1",
"SSS 2",
"SSS 3"
]
}
]
}
]
}

{
"institution_name": "Dothan Comprehensive Schools",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Toddler",
"Preparatory / Playgroup",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
},
{
"type": "Secondary",
"sub_levels": [
{
"level": "Junior Secondary",
"classes": [
"JSS 1 (Basic 7)",
"JSS 2 (Basic 8)",
"JSS 3 (Basic 9)"
]
},
{
"level": "Senior Secondary",
"classes": [
"SSS 1",
"SSS 2",
"SSS 3"
]
}
]
}
]
}

{
"institution_name": "Stars International College",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Toddler",
"Pre-Nursery",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
},
{
"type": "Secondary",
"sub_levels": [
{
"level": "Junior Secondary",
"classes": [
"JSS 1 (Basic 7)",
"JSS 2 (Basic 8)",
"JSS 3 (Basic 9)"
]
},
{
"level": "Senior Secondary",
"classes": [
"SSS 1 (Science / Tech / Business / Humanities)",
"SSS 2 (Science / Tech / Business / Humanities)",
"SSS 3 (Science / Tech / Business / Humanities)"
]
}
]
}
]
}

{
"institution_name": "St. Jude's Private Schools",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Playgroup",
"Pre-Nursery",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
},
{
"type": "Secondary",
"sub_levels": [
{
"level": "Junior Secondary",
"classes": [
"JSS 1 (Basic 7)",
"JSS 2 (Basic 8)",
"JSS 3 (Basic 9)"
]
},
{
"level": "Senior Secondary",
"classes": [
"SSS 1",
"SSS 2",
"SSS 3"
]
}
]
}
]
}

{
"institution_name": "Loral International Schools",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Toddler",
"Playgroup",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
},
{
"type": "Secondary",
"sub_levels": [
{
"level": "Junior Secondary",
"classes": [
"JSS 1 (Basic 7 / Year 7)",
"JSS 2 (Basic 8 / Year 8)",
"JSS 3 (Basic 9 / Year 9)"
]
},
{
"level": "Senior Secondary",
"classes": [
"SSS 1 (Year 10 / IGCSE Foundation)",
"SSS 2 (Year 11 / IGCSE)",
"SSS 3 (Year 12 / SSCE)"
]
}
]
},
{
"type": "Tertiary / Sixth Form",
"classes": [
"Cambridge A-Level (Year 12 - Year 13)",
"University Foundation Programme"
]
}
]
}

{
"institution_name": "Gracewood International School",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Playgroup",
"Pre-Nursery",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
},
{
"type": "Secondary",
"sub_levels": [
{
"level": "Junior Secondary",
"classes": [
"JSS 1 (Basic 7)",
"JSS 2 (Basic 8)",
"JSS 3 (Basic 9)"
]
},
{
"level": "Senior Secondary",
"classes": [
"SSS 1",
"SSS 2",
"SSS 3"
]
}
]
}
]
}

{
"institution_name": "Camilla Brook Place",
"institution_types": [
{
"type": "Nursery",
"classes": [
"Creche / Daycare",
"Playgroup / Toddler",
"Nursery I",
"Nursery II"
]
},
{
"type": "Primary",
"classes": [
"Basic I",
"Basic II",
"Basic III",
"Basic IV",
"Basic V",
"Basic VI"
]
}
]
}

We have 2 type of schools namely

1. Registered Schools : those schools that have a partnership agreement with Skulcredit and they are tiered into diff. Classes of school. Tier 4, 3, 2, 1 and 1+
2. Non-registered Schools: those schools that do not have signed agreement with Skulcredit but parent use our services to finance school fees.

Now for the tiered schools, service charge differ in each category.
Tier 4&3 - 20%
Tier 2 - 15%
Tier 1 - 12.5%
Tier 1+ - 10%

Each is on school fees amount per term.
While Non-registered Schools is the same service charge of 23.5%
