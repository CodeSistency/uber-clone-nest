/**
 * Payload del JWT token
 */
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Payload del refresh token
 */
export interface RefreshTokenPayload {
  sub: string; // user ID
  tokenId: string; // ID único del refresh token
  iat?: number;
  exp?: number;
}

/**
 * Información del usuario autenticado con permisos
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

/**
 * Resultado del login con información de permisos
 */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

/**
 * Resultado del registro con información de permisos
 */
export interface RegisterResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}
