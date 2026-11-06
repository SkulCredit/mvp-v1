import http from "http";
import app from "./app";
import env from "./config/env";
import logger from "./config/logger";
import { connectDB, sequelize } from "./config/db";
import { connectRabbitMQ, closeRabbitMQ } from "./config/rabbitmq";
import { initSocketIO } from "./config/socketio";
import { initFirebase } from "./config/firebase";
import { startRabbitMQListener } from "./notifications/rabbitmq.listener";
import { startLoanBookingConsumer } from "./queues/loan.queue";
import { startRepaymentReminderCron } from "./services/repaymentReminder.service";
import { runMigrations } from "./migrations/runner";
import { seedCatalog } from "./seeders/catalogSeeder";
import { seedSchoolTerms } from "./seeders/schoolTermSeeder";
import { seedAcademicSessions } from "./seeders/academicSessionSeeder";
import { seedSchoolBankAccounts } from "./seeders/schoolBankAccountSeeder";
import { seedAdmin } from "./seeders/adminSeeder";
import { seedFundingPartners } from "./seeders/fundingPartnerSeeder";
import { seedSchools } from "./seeders/schoolSeeder";
import ledgerService from "./services/ledger.service";
import "./models/index";

const start = async (): Promise<void> => {
  try {
    await connectDB();

    const { AuditLog: AuditLogModel, ...otherModels } =
      sequelize.models as Record<string, (typeof sequelize.models)[string]>;
    void otherModels;

    const originalAuditSync = (AuditLogModel as any).sync.bind(AuditLogModel);
    (AuditLogModel as any).sync = async () => {};

    await sequelize.sync({ alter: env.nodeEnv === "development" });
    logger.info("Database tables synced");

    (AuditLogModel as any).sync = originalAuditSync;

    await runMigrations();

    await seedCatalog();
    await seedSchoolTerms();
    await seedAcademicSessions();
    await seedSchoolBankAccounts();
    await seedAdmin();
    await seedFundingPartners();
    await seedSchools();

    // Seed the chart of accounts (idempotent upsert)
    await ledgerService.seedAccounts();

    initFirebase();

    await connectRabbitMQ();
    await startRabbitMQListener();
    await startLoanBookingConsumer();
    startRepaymentReminderCron();

    const httpServer = http.createServer(app);
    initSocketIO(httpServer);

    httpServer.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      httpServer.close(async () => {
        await closeRabbitMQ();
        await sequelize.close();
        logger.info("Shutdown complete");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (err: Error) => {
      logger.error(`Unhandled rejection: ${err.message}`);
      httpServer.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error(`Failed to start server: ${(error as Error).message}`);
    process.exit(1);
  }
};

start();
