import "../src/config/env";
import { sequelize } from "../src/config/db";
import "../src/models/index";
import authService from "../src/services/auth.service";
import {
  UserRepository,
  ParentRepository,
  SchoolRepository,
} from "../src/repositories";

const seed = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    await sequelize.query(`
      TRUNCATE TABLE
        notifications, application_events, repayments, repayment_schedules,
        disbursements, loan_offers, loan_applications, students, terms,
        school_requests, refresh_tokens, schools, parents, users
      RESTART IDENTITY CASCADE
    `);

    console.log("Tables truncated.");

    // Parent
    const { user: parentUser, parent } = await authService.registerParent({
      email: "parent@example.com",
      password: "Password@123",
      phoneNumber: "08011111111",
      firstName: "John",
      middleName: "Michael",
      lastName: "Doe",
    });
    console.log("Parent created:", parentUser.email);

    // School
    const { user: schoolUser, school } = await authService.registerSchool({
      email: "school@example.com",
      password: "Password@123",
      phoneNumber: "08022222222",
      schoolName: "Greenwood High School",
      contactPerson: "Jane Principal",
    });
    console.log("School created:", schoolUser.email);

    // Admin
    const admin = await authService.createAdmin({
      email: "akpeledavid@hotmail.com",
      password: "SkulCreditAdmin@123",
      phoneNumber: "08033333333",
    });
    console.log("Admin created:", admin.email);

    console.log("\nSeed complete.");
    console.log("  parent@example.com       /  Password@123");
    console.log("  school@example.com       /  Password@123");
    console.log("  akpeledavid@hotmail.com  /  SkulCreditAdmin@123");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seed();
