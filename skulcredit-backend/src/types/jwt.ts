import type { UserRole } from './index';

export type TokenType = 'ACCESS' | 'REFRESH';
export type AuthLevel = 'STANDARD' | 'MFA' | 'ELEVATED';
export interface TokenPermissions {
  parent: boolean;
  school: boolean;
  admin: boolean;
}


export interface TokenSecurity {
  tokenType: TokenType;
  sessionId: string;
  tokenId: string;
  authLevel: AuthLevel;
  mfaVerified: boolean;
  emailVerified: boolean;
}

export interface JwtPayload {
  iss: string;
  sub: string;
  aud: string | string[];
  userId: string;
  email: string;
  roles: Uppercase<UserRole>[];
  permissions: TokenPermissions;
  security: TokenSecurity;
  iat?: number;
  nbf?: number;
  exp?: number;
}

export interface GenerateAccessTokenInput {
  userId: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  sessionId?: string;
  mfaVerified?: boolean;
  authLevel?: AuthLevel;
}
