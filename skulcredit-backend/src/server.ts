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

// Load all models and wire up associations before syncing
import "./models/index";

const start = async (): Promise<void> => {
  try {
    await connectDB();

    // Create all core tables first (Sequelize model definitions),
    // then run migrations (which only ALTER existing tables),
    // then run seeders.
    await sequelize.sync({ alter: env.nodeEnv === "development" });
    logger.info("Database tables synced");

    await runMigrations();

    await seedCatalog();
    await seedSchoolTerms();
    await seedAcademicSessions();
    await seedSchoolBankAccounts();
    await seedAdmin();

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
