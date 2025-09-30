import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AdminAuthController } from './controllers/admin-auth.controller';

// Services
import { AdminAuthService } from './services/admin-auth.service';

// Strategies
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

// Guards
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

// Modules
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RideManagementModule } from './modules/ride-management/ride-management.module';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { DriverManagementModule } from './modules/driver-management/driver-management.module';
import { ReportsAnalyticsModule } from './modules/reports-analytics/reports-analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GeographyModule } from './modules/geography/geography.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ConfigModule as AdminConfigModule } from './modules/config/config.module';

// Prisma
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AdminConfigModule,
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('ADMIN_JWT_SECRET') ||
          configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<string>('ADMIN_JWT_EXPIRES_IN') ||
            configService.get<string>('JWT_EXPIRES_IN') ||
            '1h',
        },
      }),
      inject: [ConfigService],
    }),
    // Feature modules
    DashboardModule,
    RideManagementModule,
    UserManagementModule,
    DriverManagementModule,
    ReportsAnalyticsModule,
    NotificationsModule,
    GeographyModule,
    PricingModule,
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    AdminAuthGuard,
    PermissionsGuard,
    RolesGuard,
  ],
  exports: [AdminAuthService, AdminAuthGuard, PermissionsGuard, RolesGuard],
})
export class AdminModule {}
