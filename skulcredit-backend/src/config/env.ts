import "dotenv/config";

const env = {
  port: parseInt(process.env.PORT ?? "8080", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.APP_URL ?? "http://localhost:8080",

  databaseUrl: process.env.DATABASE_URL,
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    name: process.env.DB_NAME ?? "skulcredit",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "",
  },

  jwtSecret: process.env.JWT_SECRET ?? "supersecret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "refreshsecret",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  jwtIssuer: process.env.JWT_ISSUER ?? "SkulCredit",
  jwtAudience: process.env.JWT_AUDIENCE ?? "skulcredit-api",

  lendsqr: {
    apiKey: process.env.LENDSQR_API_KEY,
    baseUrl: process.env.LENDSQR_BASE_URL,
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  uploads: {
    // Absolute or relative path to the uploads directory on the server.
    // On DigitalOcean: set UPLOADS_DIR=/var/www/skulcredit/uploads
    dir: process.env.UPLOADS_DIR ?? "uploads",
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  },
  rabbitmq: {
    url:
      process.env.RABBITMQ_URL ??
      "amqp://skulcredit:skulcredit_pass@localhost:5672/skulcredit_vhost",
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  socketio: {
    corsOrigin: process.env.SOCKETIO_CORS_ORIGIN ?? "*",
  },
} as const;

export type Env = typeof env;
export default env;
