import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AdminService } from '../admin.service';

export const STRATEGY_NAME = 'admin-local';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(Strategy, STRATEGY_NAME) {
  private readonly logger = new Logger(AdminLocalStrategy.name);

  constructor(private adminService: AdminService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate admin login for email: ${email}`);
    
    try {
      const admin = await this.adminService.validateAdmin(email, password);
      
      if (!admin) {
        this.logger.warn(`Invalid login attempt for email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      if (!admin.isActive) {
        this.logger.warn(`Login attempt for deactivated admin: ${email}`);
        throw new UnauthorizedException('Account is deactivated');
      }
      
      this.logger.debug(`Successfully validated admin: ${email}`);
      return admin;
    } catch (error) {
      this.logger.error(`Error during admin validation: ${error.message}`, error.stack);
      throw error;
    }
  }
}
