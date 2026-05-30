export enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
