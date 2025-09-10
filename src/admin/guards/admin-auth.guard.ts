import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminAuthGuard extends AuthGuard('admin-jwt') {
  private readonly logger = new Logger(AdminAuthGuard.name);

  canActivate(context: ExecutionContext) {
    // Log para debugging
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No token found in request headers');
      throw new UnauthorizedException('No token provided');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, admin: any, info: any) {
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

    return admin;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
