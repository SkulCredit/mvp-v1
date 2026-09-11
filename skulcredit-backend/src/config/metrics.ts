import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'skulcredit_',
  labels: { app: 'skulcredit-api' },
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'skulcredit_active_connections',
  help: 'Number of currently active HTTP connections',
  registers: [register],
});

const loanApplicationsTotal = new client.Counter({
  name: 'skulcredit_loan_applications_total',
  help: 'Total loan applications submitted',
  labelNames: ['status'],
  registers: [register],
});

const userRegistrationsTotal = new client.Counter({
  name: 'skulcredit_user_registrations_total',
  help: 'Total user registrations',
  labelNames: ['role'],
  registers: [register],
});

const loginAttemptsTotal = new client.Counter({
  name: 'skulcredit_login_attempts_total',
  help: 'Total login attempts',
  labelNames: ['result'],
  registers: [register],
});

export const requestMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path === '/metrics') return next();

  const end = httpRequestDuration.startTimer();
  activeConnections.inc();

  res.on('finish', () => {
    const route = req.route
      ? req.baseUrl + req.route.path
      : req.path.replace(/[0-9a-f-]{36}/gi, ':id');

    const labels = { method: req.method, route, status: res.statusCode };
    end(labels);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
};

export const metrics = {
  loanApplicationsTotal,
  userRegistrationsTotal,
  loginAttemptsTotal,
  httpRequestTotal,
  httpRequestDuration,
};
