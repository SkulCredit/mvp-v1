import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import type { UserRole } from '../types';
import type { TokenPermissions } from '../types/jwt';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    const tokenRoles = req.user.roles.map((r) => r.toLowerCase() as UserRole);
    const hasRole    = roles.some((r) => tokenRoles.includes(r));

    if (!hasRole) {
      return next(
        new ApiError(403, `Access denied. Required role(s): ${roles.join(', ')}`)
      );
    }

    next();
  };
};

export const requirePermission = (...keys: (keyof TokenPermissions)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    const perms   = req.user.permissions;
    const granted = keys.some((k) => perms[k] === true);

    if (!granted) {
      return next(
        new ApiError(403, `Access denied. Required permission(s): ${keys.join(', ')}`)
      );
    }

    next();
  };
};
