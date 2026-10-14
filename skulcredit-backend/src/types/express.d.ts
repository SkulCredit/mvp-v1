import { JwtPayload } from './jwt';
import { AuditLocation } from '../models/AuditLog';

declare global {
  namespace Express {
    interface Request {
      user?:          JwtPayload;
      requestId?:     string;
      correlationId?: string;
      traceId?:       string;
      startedAt?:     bigint;         // process.hrtime.bigint() at request start
      geoLocation?:   AuditLocation;  // resolved by requestTracker
    }
  }
}
