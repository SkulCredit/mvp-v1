DO $$
DECLARE
  pw TEXT := '$2b$10$S5N94CQCCYTNrExUj1tl6uJ2u505yV1Pbrrz8q2lggu8fivs0/vwW';
  uid UUID;
BEGIN

  -- Gulf Flower Schools
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gulfflowerschools.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@gulfflowerschools.com',pw,'08031000001','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,bank_name,bank_account_name,bank_account_number,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Gulf Flower Schools','Gulf Flower Administrator','Lagos','Lekki','Zenith Bank','Gulf Flower Schools','1224592025','approved',NOW(),NOW());
  END IF;

  -- Foster Prime Schools
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@fosterprimeschools.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@fosterprimeschools.com',pw,'08031000002','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,bank_name,bank_account_name,bank_account_number,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Foster Prime Schools','Foster Prime Administrator','Lagos','Ajah','Zenith Bank','Foster Prime School Ltd','1228726145','approved',NOW(),NOW());
  END IF;

  -- Dothan Comprehensive Schools
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@dothancomprehensive.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@dothancomprehensive.com',pw,'08031000003','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,bank_name,bank_account_name,bank_account_number,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Dothan Comprehensive Schools','Dothan School Administrator','Lagos','Ogba','First Bank','Dothan Nursery & Pry School','2028767398','approved',NOW(),NOW());
  END IF;

  -- Stars International College
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@starsinternationalcollege.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@starsinternationalcollege.com',pw,'08031000004','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Stars International College','Stars International Administrator','Abuja','Maitama','approved',NOW(),NOW());
  END IF;

  -- St. Jude Private Schools
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@stjudesprivateschools.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@stjudesprivateschools.com',pw,'08031000005','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'St. Jude''s Private Schools','St. Jude''s Administrator','Rivers','Port Harcourt','approved',NOW(),NOW());
  END IF;

  -- Loral International Schools
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@loralinternationalschools.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@loralinternationalschools.com',pw,'08031000006','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Loral International Schools','Loral International Administrator','Lagos','Victoria Island','approved',NOW(),NOW());
  END IF;

  -- Gracewood International School
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gracewoodinternational.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@gracewoodinternational.com',pw,'08031000007','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Gracewood International School','Gracewood Administrator','Ogun','Abeokuta','approved',NOW(),NOW());
  END IF;

  -- Camilla Brook Place
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@camillabrookplace.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@camillabrookplace.com',pw,'08031000008','school',true,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,bank_name,bank_account_name,bank_account_number,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Camilla Brook Place','Camilla Brook Administrator','Lagos','Surulere','First Bank','Camilla Brook Place (Tuition)','2022385370','approved',NOW(),NOW());
  END IF;

  -- Pearlshore Academy (non-registered, pending)
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@pearlshoreacademy.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@pearlshoreacademy.com',pw,'08032000001','school',false,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Pearlshore Academy','Pearlshore Academy Administrator','Lagos','Badagry','pending',NOW(),NOW());
  END IF;

  -- Emmychord Schools (non-registered, pending)
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@emmychordschools.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@emmychordschools.com',pw,'08032000002','school',false,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Emmychord Schools','Emmychord Schools Administrator','Oyo','Ibadan','pending',NOW(),NOW());
  END IF;

  -- Allsenses School (non-registered, pending)
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@allsensesschool.com') THEN
    INSERT INTO users (id,email,password,phone_number,role,is_email_verified,is_active,created_at,updated_at)
    VALUES (gen_random_uuid(),'admin@allsensesschool.com',pw,'08032000003','school',false,true,NOW(),NOW())
    RETURNING id INTO uid;
    INSERT INTO schools (id,user_id,school_name,contact_person,address_state,address_city,status,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,'Allsenses School','Allsenses School Administrator','Enugu','Enugu','pending',NOW(),NOW());
  END IF;

END$$;
