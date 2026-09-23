PS D:\SkulCredit> docker exec skulcredit_postgres psql -U postgres -d skulcredit -c "SELECT id, name, email, status FROM funding_partners;"
 id | name | email | status 
----+------+-------+--------
(0 rows)

PS D:\SkulCredit> docker exec skulcredit_postgres psql -U postgres -d skulcredit -c "INSERT INTO funding_partners (id, name, email, phone, contact_person, status, notes, created_at, updated_at) VALUES (gen_random_uuid(), 'Test User', 'Eurekafortunatong@gmail.com', NULL, NULL, 'active', NULL, NOW(), NOW()) ON CONFLICT (email) DO NOTHING RETURNING id, name, email, status;"
                  id                  |   name    |            email            | status 
--------------------------------------+-----------+-----------------------------+--------
 581668bc-c7b6-4c80-9dae-1c78de2229ca | Test User | Eurekafortunatong@gmail.com | active
(1 row)

INSERT 0 1
PS D:\SkulCredit> docker exec skulcredit_postgres psql -U postgres -d skulcredit -c "UPDATE funding_partners SET email = 'willstonestrategic@gmail.com', updated_at = NOW() WHERE email = 'Eurekafortunatong@gmail.com' RETURNING id, name, email, status;"
                  id                  |   name    |            email             | status 
--------------------------------------+-----------+------------------------------+--------
 581668bc-c7b6-4c80-9dae-1c78de2229ca | Test User | willstonestrategic@gmail.com | active
(1 row)

PS D:\SkulCredit> docker exec skulcredit_postgres psql -U postgres -d skulcredit -c "UPDATE funding_partners SET email = 'eurekafortunatong@gmail.com', updated_at = NOW() WHERE email = 'willstonestrategic@gmail.com' RETURNING id, name, email, status;"
                  id                  |   name    |            email            | status 
--------------------------------------+-----------+-----------------------------+--------
 581668bc-c7b6-4c80-9dae-1c78de2229ca | Test User | eurekafortunatong@gmail.com | active
(1 row)