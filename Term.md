# We have 2 type of schools namely
1. Registered Schools : those schools that have a partnership agreement with Skulcredit and they are tiered into diff. Classes of school. Tier 4, 3, 2, 1 and 1+.

2. Non-registered Schools: those schools that do not have signed agreement with Skulcredit but parent use our services to finance school fees.

Now for the tiered schools, service charge differ in each category. 
Tier 4&3 - 20%
Tier 2 - 15% 
Tier 1 - 12.5%
Tier 1+ - 10% 

Each is on school fees amount per term.
While Non-registered Schools is the same service charge of 23.5%.

## Schools list

1. Gulf Flower Schools
2. Foster Prime Schools
3. Dothan Comprehensive Schools 
4. Stars International college 
5. St Judes Private Schools 
6. Loral international Schools
7. Gracewood international school
8. Camilla Brook Place

# For the schools i provided, dothan comprehensive school is the only registered school for now.

> Rest are non-registered. So for non-registered schools, there will be a button by the side for add school. It will now ask for details of the school which includes name of school, location, contact person and school account details which will use to verify with school within 48hrs b4 we finally list the school.

## Account details 
1. Gulf Flower Schools -1224592025 Zenith Bank 
2.  1228726145
Foster Prime School Ltd
Zenith bank
3. FIRST BANK – CAMILLA BROOK PLACE (TUITION) – 2022385370
4. DOTHAN NURSERY & PRY SCHOOL FIRST BANK 2028767398
4b. DOTHAN NURSERY & PRY SCHOOL WEMA BANK 0126041565

# TASK 1

we need to find a way to re-configured our application in regards to knowing register schools and non-register schools so that we can give the actual percentage to the right school.
Do not add any school that is not in this list into our system please because this informations are from the client himself, so dont add anything that is not from him into the system.

> Maybe create a table that store the tier or percentage and in school table u reference the tier id so when fetching that school data or create application, the system can pull the tier and also easily know that is registered school or not. or if you have a better way to achieve this, please do.


# Task 2

- we need to store school account details.  So create a table call school_bank_account_details and make sure it the school id and foriegn key, so we can easily pull the school bank details when process the pay-out or crediting the school.