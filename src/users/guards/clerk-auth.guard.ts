import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClerkService } from '../clerk.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('🔐 ClerkAuthGuard - Headers recibidos:', {
      authorization: authHeader ? 'Presente' : 'Ausente',
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent']
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ ClerkAuthGuard - No se encontró header Authorization o no comienza con Bearer');
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const token = authHeader.substring(7);
    console.log('🔑 ClerkAuthGuard - Token recibido (primeros 20 caracteres):', token.substring(0, 20) + '...');

    try {
      // Verificar el token
      console.log('🔍 ClerkAuthGuard - Verificando token...');
      const userInfo = await this.clerkService.verifyToken(token);
      console.log('✅ ClerkAuthGuard - Token verificado exitosamente:', {
        userId: userInfo.sub || userInfo.userId,
        email: userInfo.email,
        exp: userInfo.exp
      });

      // Agregar información del usuario al request para usar en los controladores
      request.clerkUser = userInfo;
      request.clerkId = userInfo.sub || userInfo.userId;

      return true;
    } catch (error) {
      console.log('❌ ClerkAuthGuard - Error al verificar token:', error.message);
      throw new UnauthorizedException(`Token inválido o expirado: ${error.message}`);
    }
  }
}
