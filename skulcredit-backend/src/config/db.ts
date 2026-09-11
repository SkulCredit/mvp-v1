import { Sequelize } from 'sequelize';
import env from './env';
import logger from './logger';

let sequelize: Sequelize;

if (env.databaseUrl) {
  sequelize = new Sequelize(env.databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: env.nodeEnv === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
    logging: (msg: string) => logger.debug(msg),
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  });
} else {
  sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
    host:    env.db.host,
    port:    env.db.port,
    dialect: 'postgres',
    logging: (msg: string) => logger.debug(msg),
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  });
}

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully');
  } catch (error) {
    logger.error(`PostgreSQL connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export { sequelize };
