import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

interface BankAccountSeed {
  schoolName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string | null;
  isPrimary: boolean;
}

const BANK_CODES: Record<string, string> = {
  "Zenith Bank":  "057",
  "First Bank":   "011",
  "Wema Bank":    "035",
};

const BANK_ACCOUNTS: BankAccountSeed[] = [
  {
    schoolName:     "Gulf Flower Schools",
    bankName:       "Zenith Bank",
    accountNumber:  "1224592025",
    accountName:    "Gulf Flower Schools",
    bankCode:       BANK_CODES["Zenith Bank"],
    isPrimary:      true,
  },
  {
    schoolName:     "Foster Prime Schools",
    bankName:       "Zenith Bank",
    accountNumber:  "1228726145",
    accountName:    "Foster Prime School Ltd",
    bankCode:       BANK_CODES["Zenith Bank"],
    isPrimary:      true,
  },
  {
    schoolName:     "Camilla Brook Place",
    bankName:       "First Bank",
    accountNumber:  "2022385370",
    accountName:    "Camilla Brook Place (Tuition)",
    bankCode:       BANK_CODES["First Bank"],
    isPrimary:      true,
  },
  {
    schoolName:     "Dothan Comprehensive Schools",
    bankName:       "First Bank",
    accountNumber:  "2028767398",
    accountName:    "Dothan Nursery & Pry School",
    bankCode:       BANK_CODES["First Bank"],
    isPrimary:      true,
  },
  {
    schoolName:     "Dothan Comprehensive Schools",
    bankName:       "Wema Bank",
    accountNumber:  "0126041565",
    accountName:    "Dothan Nursery & Pry School",
    bankCode:       BANK_CODES["Wema Bank"],
    isPrimary:      false,
  },
];

export async function seedSchoolBankAccounts(): Promise<void> {
  const [existing] = await sequelize.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM school_bank_account_details",
    { type: QueryTypes.SELECT },
  );

  if (parseInt(existing.count, 10) > 0) {
    logger.info("School bank accounts already seeded — skipping");
    return;
  }

  logger.info(`Seeding ${BANK_ACCOUNTS.length} school bank account(s)…`);

  for (const acct of BANK_ACCOUNTS) {
    const [school] = await sequelize.query<{ id: string }>(
      `SELECT id FROM catalog_schools WHERE name = :name LIMIT 1`,
      { replacements: { name: acct.schoolName }, type: QueryTypes.SELECT },
    );

    if (!school) {
      logger.warn(`[schoolBankAccountSeeder] School not found: "${acct.schoolName}" — skipping`);
      continue;
    }

    await sequelize.query(
      `INSERT INTO school_bank_account_details
         (id, catalog_school_id, bank_name, account_number, account_name,
          bank_code, is_primary, is_verified, created_at, updated_at)
       VALUES
         (gen_random_uuid(), :schoolId, :bankName, :accountNumber, :accountName,
          :bankCode, :isPrimary, false, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      {
        replacements: {
          schoolId:      school.id,
          bankName:      acct.bankName,
          accountNumber: acct.accountNumber,
          accountName:   acct.accountName,
          bankCode:      acct.bankCode,
          isPrimary:     acct.isPrimary,
        },
        type: QueryTypes.INSERT,
      },
    );
  }

  logger.info("School bank accounts seeded successfully");
}
