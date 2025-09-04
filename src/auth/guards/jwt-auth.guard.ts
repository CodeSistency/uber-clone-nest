import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Agregar logs para debugging
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('🔐 JwtAuthGuard - Headers recibidos:', {
      authorization: authHeader ? 'Presente' : 'Ausente',
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent']
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ JwtAuthGuard - No se encontró header Authorization o no comienza con Bearer');
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const token = authHeader.substring(7);
    console.log('🔑 JwtAuthGuard - Token recibido (primeros 20 caracteres):', token.substring(0, 20) + '...');

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.log('❌ JwtAuthGuard - Error al validar token:', err?.message || info?.message);
      throw err || new UnauthorizedException('Token inválido o expirado');
    }

    console.log('✅ JwtAuthGuard - Token validado exitosamente para usuario:', {
      id: user.id,
      email: user.email,
    });

    return user;
  }
}
