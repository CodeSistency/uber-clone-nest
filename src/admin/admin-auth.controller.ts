import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AdminLoginDto) {
    this.logger.log(`Admin login attempt for email: ${loginDto.email}`);
    return this.adminService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // En una implementación más completa, aquí invalidaríamos el token
    // Por ahora, solo retornamos un mensaje de éxito
    this.logger.log('Admin logout');
    return {
      message: 'Logged out successfully',
      success: true,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    // TODO: Implementar refresh token logic
    this.logger.log('Admin token refresh attempt');
    return {
      message: 'Token refresh not yet implemented',
      success: false,
    };
  }

  // Endpoint temporal para testing sin autenticación
  @Post('test-login')
  @HttpCode(HttpStatus.OK)
  async testLogin(@Body() loginDto: any) {
    this.logger.log('Test login attempt');
    return {
      message: 'Test login endpoint - use regular login endpoint',
      credentials: {
        superadmin: 'superadmin@uberclone.com / SuperAdmin123!',
        admin: 'admin@uberclone.com / Admin123!',
        moderator: 'moderator@uberclone.com / Moderator123!',
        support: 'support@uberclone.com / Support123!',
      }
    };
  }
}
