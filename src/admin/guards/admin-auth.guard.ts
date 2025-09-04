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
    // Log errores de autenticación
    if (err || !admin) {
      this.logger.error(`Admin authentication failed: ${err?.message || info?.message}`);
      throw err || new UnauthorizedException('Invalid admin token');
    }

    this.logger.debug(`Admin authenticated: ${admin.email} (${admin.role})`);
    return admin;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
