import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorador para extraer el Clerk ID del token JWT
 * Uso: @ClerkUser() clerkId: string
 */
export const ClerkUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // El Clerk ID ya debería estar disponible en el request gracias al ClerkAuthGuard
    if (request.clerkId) {
      return request.clerkId;
    }

    // Fallback: extraer manualmente del token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorización no proporcionado');
    }

    const token = authHeader.substring(7);
    try {
      return extractClerkIdFromToken(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  },
);

/**
 * Decorador para extraer toda la información del usuario de Clerk
 * Uso: @ClerkUserInfo() userInfo: any
 */
export const ClerkUserInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();

    // La información del usuario ya debería estar disponible en el request
    if (request.clerkUser) {
      return request.clerkUser;
    }

    // Fallback: extraer manualmente del token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorización no proporcionado');
    }

    const token = authHeader.substring(7);
    try {
      return extractUserInfoFromToken(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  },
);

/**
 * Función auxiliar para extraer Clerk ID del token
 */
function extractClerkIdFromToken(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Token JWT malformado');
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );

    const clerkId = payload.sub || payload.userId;
    if (!clerkId) {
      throw new UnauthorizedException('No se pudo extraer el Clerk ID del token');
    }

    return clerkId;
  } catch (error) {
    throw new UnauthorizedException('Error al decodificar token');
  }
}

/**
 * Función auxiliar para extraer información del usuario del token
 */
function extractUserInfoFromToken(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Token JWT malformado');
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );

    return {
      clerkId: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      username: payload.username,
      imageUrl: payload.imageUrl,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch (error) {
    throw new UnauthorizedException('Error al decodificar token');
  }
}
