import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

interface ContactSeed {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  isPrimary: boolean;
}

interface PartnerSeed {
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  notes: string | null;
  contacts: ContactSeed[];
}

const PARTNERS: PartnerSeed[] = [
  {
    name: "Microfinance Bank of UNILAG",
    email: "info@unilagmfbank.com",
    phone: null,
    status: "active",
    notes: "Handles Tier 3 and Tier 4 school disbursements",
    contacts: [
      {
        fullName: "Otunba Daniel Oladotun",
        email: "dotunba@unilagmfbank.com",
        phone: "09034421960",
        position: "Executive Trainee",
        isPrimary: false,
      },
      {
        fullName: "Olanrewaju Simisola Oluwakemi",
        email: "solanrewaju@unilagmfbank.com",
        phone: "08123434302",
        position: "Head of Marketing",
        isPrimary: true,
      },
    ],
  },
];

export async function seedFundingPartners(): Promise<void> {
  logger.info(`Seeding ${PARTNERS.length} funding partner(s)…`);

  for (const partner of PARTNERS) {
    const [existing] = await sequelize.query<{ id: string }>(
      `SELECT id FROM funding_partners WHERE email = :email LIMIT 1`,
      { replacements: { email: partner.email }, type: QueryTypes.SELECT },
    );

    let partnerId: string;

    if (existing) {
      partnerId = existing.id;
      await sequelize.query(
        `UPDATE funding_partners SET name = :name, status = :status, notes = :notes, updated_at = NOW() WHERE id = :id`,
        {
          replacements: { name: partner.name, status: partner.status, notes: partner.notes, id: partnerId },
          type: QueryTypes.UPDATE,
        },
      );
      logger.info(`[fundingPartnerSeeder] Updated partner: "${partner.name}"`);
    } else {
      const [rows] = await sequelize.query<{ id: string }>(
        `INSERT INTO funding_partners (id, name, email, phone, status, notes, created_at, updated_at)
         VALUES (gen_random_uuid(), :name, :email, :phone, :status, :notes, NOW(), NOW())
         RETURNING id`,
        {
          replacements: {
            name: partner.name,
            email: partner.email,
            phone: partner.phone,
            status: partner.status,
            notes: partner.notes,
          },
          type: QueryTypes.SELECT,
        },
      );
      partnerId = (rows as unknown as { id: string }).id;
      logger.info(`[fundingPartnerSeeder] Created partner: "${partner.name}"`);
    }

    for (const contact of partner.contacts) {
      await sequelize.query(
        `INSERT INTO funding_partner_contacts
           (id, funding_partner_id, full_name, email, phone, position, is_primary, status, created_at, updated_at)
         VALUES
           (gen_random_uuid(), :partnerId, :fullName, :email, :phone, :position, :isPrimary, 'active', NOW(), NOW())
         ON CONFLICT (email, funding_partner_id) DO UPDATE
           SET full_name  = EXCLUDED.full_name,
               phone      = EXCLUDED.phone,
               position   = EXCLUDED.position,
               is_primary = EXCLUDED.is_primary,
               updated_at = NOW()`,
        {
          replacements: {
            partnerId,
            fullName: contact.fullName,
            email: contact.email,
            phone: contact.phone,
            position: contact.position,
            isPrimary: contact.isPrimary,
          },
          type: QueryTypes.INSERT,
        },
      );
    }

    logger.info(`[fundingPartnerSeeder] Seeded ${partner.contacts.length} contact(s) for "${partner.name}"`);
  }

  logger.info("Funding partners seeded successfully");
}
