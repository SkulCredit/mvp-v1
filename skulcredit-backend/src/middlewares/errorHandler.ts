import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
} from 'sequelize';
import { ZodError } from 'zod';
import logger from '../config/logger';

interface AppError extends Error {
  statusCode?: number;
  errors?: unknown[];
  isOperational?: boolean;
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  let statusCode = err.statusCode ?? 500;
  let message    = err.message ?? 'Internal Server Error';
  let errors: unknown[] = [];

  if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message    = 'A record with this value already exists';
    errors     = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    message    = 'Validation error';
    errors     = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof ForeignKeyConstraintError) {
    statusCode = 400;
    message    = 'Related record not found';
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
    message    = 'Database error';
    logger.error(`[DatabaseError] ${err.message}`);
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message    = 'Validation Error';
    errors     = err.issues;
  }

  if (statusCode === 500) {
    logger.error(`[500] ${err.message}`, err.stack);
  }

  res.locals.errorMessage = message;

  const body: Record<string, unknown> = { success: false, message };
  if (errors.length > 0) body.errors = errors;

  res.status(statusCode).json(body);
};

export default errorHandler;
