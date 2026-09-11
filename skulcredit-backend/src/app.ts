import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import logger from "./config/logger";
import swaggerSpec from "./config/swagger";
import { register, requestMetricsMiddleware } from "./config/metrics";
import requestTracker from "./middlewares/requestTracker";
import routes from "./routes/index";
import errorHandler from "./middlewares/errorHandler";
import env from "./config/env";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins =
  env.socketio.corsOrigin === "*"
    ? true 
    : env.socketio.corsOrigin.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(requestTracker);
app.use(requestMetricsMiddleware);

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end((err as Error).message);
  }
});

app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "SkulCredit API Docs",
    customCss: ".swagger-ui .topbar { background-color: #7A0E42; }",
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.get("/api/v1/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
