import bcrypt from "bcryptjs";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

interface SchoolSeed {
  schoolName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  addressState: string;
  addressCity: string;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  /** true  → status = "approved", email verified
   *  false → status = "pending",  email unverified */
  registered: boolean;
}

const DEFAULT_PASSWORD = "School@2026";

const SCHOOLS: SchoolSeed[] = [
  // ── Registered schools ────────────────────────────────────────────────────
  {
    schoolName:        "Gulf Flower Schools",
    contactPerson:     "Gulf Flower Administrator",
    email:             "admin@gulfflowerschools.com",
    phoneNumber:       "08031000001",
    addressState:      "Lagos",
    addressCity:       "Lekki",
    bankName:          "Zenith Bank",
    bankAccountName:   "Gulf Flower Schools",
    bankAccountNumber: "1224592025",
    registered:        true,
  },
  {
    schoolName:        "Foster Prime Schools",
    contactPerson:     "Foster Prime Administrator",
    email:             "admin@fosterprimeschools.com",
    phoneNumber:       "08031000002",
    addressState:      "Lagos",
    addressCity:       "Ajah",
    bankName:          "Zenith Bank",
    bankAccountName:   "Foster Prime School Ltd",
    bankAccountNumber: "1228726145",
    registered:        true,
  },
  {
    schoolName:        "Dothan Comprehensive Schools",
    contactPerson:     "Dothan School Administrator",
    email:             "admin@dothancomprehensive.com",
    phoneNumber:       "08031000003",
    addressState:      "Lagos",
    addressCity:       "Ogba",
    bankName:          "First Bank",
    bankAccountName:   "Dothan Nursery & Pry School",
    bankAccountNumber: "2028767398",
    registered:        true,
  },
  {
    schoolName:        "Stars International College",
    contactPerson:     "Stars International Administrator",
    email:             "admin@starsinternationalcollege.com",
    phoneNumber:       "08031000004",
    addressState:      "Abuja",
    addressCity:       "Maitama",
    bankName:          null,
    bankAccountName:   null,
    bankAccountNumber: null,
    registered:        true,
  },
  {
    schoolName:        "St. Jude's Private Schools",
    contactPerson:     "St. Jude's Administrator",
    email:             "admin@stjudesprivateschools.com",
    phoneNumber:       "08031000005",
    addressState:      "Rivers",
    addressCity:       "Port Harcourt",
    bankName:          null,
    bankAccountName:   null,
    bankAccountNumber: null,
    registered:        true,
  },
  {
    schoolName:        "Loral International Schools",
    contactPerson:     "Loral International Administrator",
    email:             "admin@loralinternationalschools.com",
    phoneNumber:       "08031000006",
    addressState:      "Lagos",
    addressCity:       "Victoria Island",
    bankName:          null,
    bankAccountName:   null,
    bankAccountNumber: null,
    registered:        true,
  },
  {
    schoolName:        "Gracewood International School",
    contactPerson:     "Gracewood Administrator",
    email:             "admin@gracewoodinternational.com",
    phoneNumber:       "08031000007",
    addressState:      "Ogun",
    addressCity:       "Abeokuta",
    bankName:          null,
    bankAccountName:   null,
    bankAccountNumber: null,
    registered:        true,
  },
  {
    schoolName:        "Camilla Brook Place",
    contactPerson:     "Camilla Brook Administrator",
    email:             "admin@camillabrookplace.com",
    phoneNumber:       "08031000008",
    addressState:      "Lagos",
    addressCity:       "Surulere",
    bankName:          "First Bank",
    bankAccountName:   "Camilla Brook Place (Tuition)",
    bankAccountNumber: "2022385370",
    registered:        true,
  },

  // ── Non-registered schools ─────────────────────────────────────────────────
  {
    schoolName:        "Pearlshore Academy",
    contactPerson:     "Pearlshore Academy Administrator",
    email:             "admin@pearlshoreacademy.com",
    phoneNumber:       "08032000001",
    addressState:      "Lagos",
    addressCity:       "Badagry",
    bankName:          null,
    bankAccountName:   null,
    bankAccountNumber: null,
    registered:        false,
  },
  {
    schoolName:        "Emmychord Schools",
    contactPerson:     "Emmychord Schools Administrator",
    email:             "admin@emmychordschools.com",
    phoneNumber:       "08032000002",
    addressState:      "Oyo",
    addressCity:       "Ibadan",
    bankName:          null,
    bankAccountName:   null,
    bankAccountNumber: null,
    registered:        false,
  },
  {
    schoolName:        "Allsenses School",
    contactPerson:     "Allsenses School Administrator",
    email:             "admin@allsensesschool.com",
    phoneNumber:       "08032000003",
    addressState:      "Enugu",
    addressCity:       "Enugu",
    bankName:          null,
    bankAccountName:   null,
    bankAccountNumber: null,
    registered:        false,
  },
];

export async function seedSchools(): Promise<void> {
  logger.info("Seeding school accounts…");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let created = 0;
  let skipped = 0;

  for (const school of SCHOOLS) {
    // Check if this email already has a user account
    const [existing] = await sequelize.query<{ id: string }>(
      "SELECT id FROM users WHERE email = :email LIMIT 1",
      { replacements: { email: school.email }, type: QueryTypes.SELECT },
    );

    if (existing) {
      logger.info(`[schoolSeeder] Already exists — skipping: "${school.schoolName}"`);
      skipped++;
      continue;
    }

    const status: "approved" | "pending" = school.registered ? "approved" : "pending";
    const isEmailVerified = school.registered;

    const t = await sequelize.transaction();
    try {
      // 1. Create user
      const [userRow] = await sequelize.query<{ id: string }>(
        `INSERT INTO users
           (id, email, password, phone_number, role,
            is_email_verified, is_active, created_at, updated_at)
         VALUES
           (gen_random_uuid(), :email, :password, :phoneNumber, 'school',
            :isEmailVerified, true, NOW(), NOW())
         RETURNING id`,
        {
          replacements: {
            email:           school.email,
            password:        hashedPassword,
            phoneNumber:     school.phoneNumber,
            isEmailVerified,
          },
          type: QueryTypes.SELECT,
          transaction: t,
        },
      );

      // 2. Create school profile
      await sequelize.query(
        `INSERT INTO schools
           (id, user_id, school_name, contact_person,
            address_state, address_city,
            bank_name, bank_account_name, bank_account_number,
            status, created_at, updated_at)
         VALUES
           (gen_random_uuid(), :userId, :schoolName, :contactPerson,
            :addressState, :addressCity,
            :bankName, :bankAccountName, :bankAccountNumber,
            :status, NOW(), NOW())`,
        {
          replacements: {
            userId:            userRow.id,
            schoolName:        school.schoolName,
            contactPerson:     school.contactPerson,
            addressState:      school.addressState,
            addressCity:       school.addressCity,
            bankName:          school.bankName,
            bankAccountName:   school.bankAccountName,
            bankAccountNumber: school.bankAccountNumber,
            status,
          },
          type: QueryTypes.INSERT,
          transaction: t,
        },
      );

      await t.commit();
      logger.info(`[schoolSeeder] Created (${status}): "${school.schoolName}" — ${school.email}`);
      created++;
    } catch (err) {
      await t.rollback();
      logger.error(`[schoolSeeder] Failed to create "${school.schoolName}": ${(err as Error).message}`);
    }
  }

  logger.info(
    `School seed complete — ${created} created, ${skipped} skipped`,
  );
}
