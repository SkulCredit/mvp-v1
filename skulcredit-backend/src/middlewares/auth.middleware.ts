import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import ApiError from '../utils/apiError';
import type { JwtPayload } from '../types/jwt';

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Not authorized to access this route'));
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer:   env.jwtIssuer,
      audience: env.jwtAudience,
    }) as JwtPayload;

    if (decoded.security?.tokenType !== 'ACCESS') {
      return next(new ApiError(401, 'Invalid token type'));
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Token has expired'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid token'));
    }
    next(new ApiError(401, 'Not authorized to access this route'));
  }
};

export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.security?.emailVerified) {
    return next(new ApiError(403, 'Please verify your email address to access this resource'));
  }
  next();
};
