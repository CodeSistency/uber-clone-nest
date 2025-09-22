import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY_NAME } from '../strategies/admin-jwt.strategy';

@Injectable()
export class AdminAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
  private readonly logger = new Logger(AdminAuthGuard.name);

  canActivate(context: ExecutionContext) {
    // Skip authentication for public routes
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    
    const publicRoutes = [
      '/',
      '/admin/auth/login',
      '/admin/auth/refresh-token',
    ];
    
    if (publicRoutes.some(route => path === route || path.startsWith(route + '/'))) {
      return true;
    }
    
    // For all other routes, require authentication
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn(`No token found in request headers in ${path}`);
      throw new UnauthorizedException('No token provided');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, admin: any, info: any, context: any) {
    // Log detallado de errores de autenticación
    if (err) {
      this.logger.error(`Admin authentication error:`, {
        error: err.message,
        stack: err.stack,
        info: info?.message
      });
      throw new UnauthorizedException(`Admin authentication failed: ${err.message}`);
    }

    if (!admin) {
      this.logger.error(`Admin authentication failed - no admin returned:`, {
        info: info?.message,
        jwtSecretConfigured: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length || 0
      });
      throw new UnauthorizedException('Admin not authenticated');
    }

    this.logger.debug(`Admin authenticated successfully:`, {
      email: admin.email,
      role: admin.adminRole,
      permissions: admin.adminPermissions?.length || 0
    });

    // Configurar el admin en el request para que esté disponible en otros guards
    const request = context.switchToHttp().getRequest();
    request.admin = admin;

    return admin;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
