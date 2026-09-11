import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import logger from '../config/logger';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

function parseDevice(ua: string | undefined) {
  if (!ua) {
    return {
      device_type: 'unknown', device_browser: 'unknown',
      device_browser_version: null, device_os: 'unknown',
      device_os_version: null, device_raw: null,
    };
  }
  const r = new UAParser(ua).getResult();
  return {
    device_type:            r.device?.type     ?? 'desktop',
    device_browser:         r.browser?.name    ?? 'unknown',
    device_browser_version: r.browser?.version ?? null,
    device_os:              r.os?.name         ?? 'unknown',
    device_os_version:      r.os?.version      ?? null,
    device_raw: ua,
  };
}

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|::ffff:127\.)/;

function getLocation(ip: string) {
  const clean = ip.replace(/^::ffff:/, '');
  if (!clean || clean === 'unknown' || PRIVATE_IP.test(clean)) {
    return { location_country: 'local', location_region: null, location_city: null, location_lat: null, location_lon: null };
  }
  const geo = geoip.lookup(clean);
  if (!geo) {
    return { location_country: 'unknown', location_region: null, location_city: null, location_lat: null, location_lon: null };
  }
  return {
    location_country: geo.country ?? null,
    location_region:  geo.region  ?? null,
    location_city:    geo.city    ?? null,
    location_lat:     geo.ll?.[0] ?? null,
    location_lon:     geo.ll?.[1] ?? null,
  };
}

function normaliseRoute(req: Request): string {
  if (req.route) return req.baseUrl + req.route.path;
  return req.path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
}

function getOutcome(status: number): string {
  if (status < 400) return 'success';
  if (status < 500) return 'client_error';
  return 'server_error';
}

const SKIP_PATHS = new Set(['/metrics', '/api/v1/health', '/favicon.ico']);

const requestTracker = (req: Request, res: Response, next: NextFunction): void => {
  if (SKIP_PATHS.has(req.path)) return next();

  const requestId = uuidv4();
  req.requestId   = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startAt  = process.hrtime.bigint();
  const ip       = getClientIp(req);
  const device   = parseDevice(req.headers['user-agent']);
  const location = getLocation(ip);

  logger.info('incoming_request', {
    requestId, type: 'request', method: req.method, url: req.originalUrl,
    ip, referer: req.headers['referer'] ?? null, ...device, ...location,
  });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startAt) / 1e6;
    const status     = res.statusCode;
    const logLevel   = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    logger[logLevel]('completed_request', {
      requestId, type: 'response', method: req.method, url: req.originalUrl,
      route: normaliseRoute(req), status, success: status < 400,
      outcome: getOutcome(status), duration_ms: Math.round(durationMs * 100) / 100,
      ip, ...device, ...location,
      userId:   req.user?.userId        ?? null,
      userRole: req.user?.roles?.[0]    ?? null,
      ...(status >= 400 && { error: res.locals.errorMessage ?? null }),
    });
  });

  next();
};

export default requestTracker;
