import bcrypt from "bcryptjs";
import logger from "../config/logger";
import { UserRepository } from "../repositories";

export async function seedAdmin(): Promise<void> {
  const email = process.env["ADMIN_EMAIL"] ?? "akpeledavid@hotmail.com";
  const password = process.env["ADMIN_PASSWORD"] ?? "SkulCreditAdmin@123";
  const phone = process.env["ADMIN_PHONE"] ?? "08033333333";

  const existing = await UserRepository.findOne({ email });
  if (existing) {
    logger.info(`Admin account (${email}) already exists — skipping seed`);
    return;
  }

  await UserRepository.create({
    email,
    password: await bcrypt.hash(password, 10),
    phoneNumber: phone,
    role: "admin",
    isEmailVerified: true,
    isActive: true,
  });

  logger.info(`Default admin account created: ${email}`);
}
