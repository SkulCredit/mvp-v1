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

// Load all models and wire up associations before syncing
import "./models/index";

const start = async (): Promise<void> => {
  try {
    await connectDB();

    // Run schema migrations FIRST — before sync — so migration-managed tables
    // (e.g. audit_logs) are in their correct state before Sequelize tries to
    // inspect or alter them.
    await runMigrations();

    // Sync all models EXCEPT AuditLog. AuditLog is fully owned by migrations
    // (017_migrate_audit_logs_schema). We must not let sequelize.sync() try to
    // ALTER the enum columns — it will fail. We achieve this by syncing the
    // AuditLog model separately with `{ force: false, alter: false }` so it
    // only creates the table if it somehow doesn't exist, but never alters it.
    const { AuditLog: AuditLogModel, ...otherModels } = sequelize.models as Record<string, typeof sequelize.models[string]>;
    void otherModels; // referenced to avoid lint warning

    // Temporarily stub out AuditLog.sync so sequelize.sync() skips it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalAuditSync = (AuditLogModel as any).sync.bind(AuditLogModel);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AuditLogModel as any).sync = async () => { /* skip — managed by migrations */ };

    await sequelize.sync({ alter: env.nodeEnv === "development" });
    logger.info("Database tables synced");

    // Restore the real sync method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AuditLogModel as any).sync = originalAuditSync;

    await seedCatalog();
    await seedSchoolTerms();
    await seedAcademicSessions();
    await seedSchoolBankAccounts();
    await seedAdmin();
    await seedFundingPartners();

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
