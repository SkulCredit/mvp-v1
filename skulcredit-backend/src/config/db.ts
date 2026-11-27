import { Sequelize } from 'sequelize';
import pg from 'pg';
import env from './env';
import logger from './logger';

let sequelize: Sequelize;

if (env.databaseUrl) {
  sequelize = new Sequelize(env.databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: env.nodeEnv === 'production' || env.databaseUrl.includes('supabase') || env.databaseUrl.includes('pooler')
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
    logging: (msg: string) => logger.debug(msg),
    pool: { max: process.env.VERCEL || env.nodeEnv === 'production' ? 2 : 10, min: 0, acquire: 30000, idle: 5000 },
  });
} else {
  sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
    host:    env.db.host,
    port:    env.db.port,
    dialect: 'postgres',
    dialectModule: pg,
    logging: (msg: string) => logger.debug(msg),
    pool: { max: process.env.VERCEL || env.nodeEnv === 'production' ? 2 : 10, min: 0, acquire: 30000, idle: 5000 },
  });
}

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;
  try {
    await sequelize.authenticate();
    isConnected = true;
    logger.info('PostgreSQL connected successfully');
  } catch (error) {
    logger.error(`PostgreSQL connection error: ${(error as Error).message}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export { sequelize };
