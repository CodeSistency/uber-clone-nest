import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RouterModule } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

// Core services and controllers
import { AdminService } from './admin.service';
import { AdminAuthController } from './controllers/admin-auth.controller';

// Strategies
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
// Guards
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

// Core modules
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../config/config.module';

// Feature modules
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminManagementModule } from './modules/admin-management/admin-management.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { DriverManagementModule } from './modules/driver-management/driver-management.module';
import { RideManagementModule } from './modules/ride-management/ride-management.module';
import { StoreManagementModule } from './modules/store-management/store-management.module';
import { ReportsModule } from './modules/reports/reports.module';

// Admin module tags for Swagger documentation
export const ADMIN_MODULE_TAGS = [
  { name: 'admin/auth', description: 'Admin authentication and authorization' },
  {
    name: 'admin/profile',
    description: 'Admin profile and account management',
  },
  {
    name: 'admin/dashboard',
    description: 'Admin dashboard statistics and overview',
  },
  {
    name: 'admin/administration',
    description: 'System administration and settings',
  },
  { name: 'admin/users', description: 'End user management' },
  { name: 'admin/drivers', description: 'Driver management and verification' },
  { name: 'admin/merchants', description: 'Store and merchant management' },
  { name: 'admin/rides', description: 'Ride management and tracking' },
  { name: 'admin/reports', description: 'Analytics and reporting tools' },
] as const;

// Feature modules array for better maintainability
const ADMIN_FEATURE_MODULES = [
  DashboardModule,
  AdminManagementModule,
  ProfileModule,
  UserManagementModule,
  DriverManagementModule,
  RideManagementModule,
  StoreManagementModule,
  ReportsModule,
] as const;

// Router configuration
const ADMIN_ROUTES = [
  { path: 'dashboard', module: DashboardModule },
  { path: 'administration', module: AdminManagementModule },
  { path: 'profile', module: ProfileModule },
  { path: 'users', module: UserManagementModule },
  { path: 'drivers', module: DriverManagementModule },
  { path: 'rides', module: RideManagementModule },
  { path: 'stores', module: StoreManagementModule },
  { path: 'reports', module: ReportsModule },
] as const;

@Module({
  imports: [
    // Core modules
    PrismaModule,
    AppConfigModule,

    // Authentication setup
    PassportModule.register({
      defaultStrategy: 'admin-jwt',
      session: false,
    }),

    // JWT configuration with proper async setup
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '1h');

        if (!secret) {
          throw new Error('JWT_SECRET is required but not provided');
        }

        return {
          secret,
          signOptions: { expiresIn },
          verifyOptions: { ignoreExpiration: false },
        };
      },
    }),

    // Router configuration - cleaner approach
    RouterModule.register([
      {
        path: 'admin',
        children: [
          // Auth is handled by controller, not a separate module
          ...ADMIN_ROUTES,
        ],
      },
    ]),

    // Feature modules
    ...ADMIN_FEATURE_MODULES,
  ],

  controllers: [AdminAuthController],

  providers: [
    // Core service
    AdminService,

    // Authentication strategies - simplified registration
    AdminJwtStrategy,

    // Guards - only register what's needed locally
    AdminAuthGuard,
    PermissionsGuard,
  ],

  exports: [
    // Export only what other modules need
    AdminService,
    AdminAuthGuard,
    PermissionsGuard,
    JwtModule,
    PassportModule,

    // Export strategies if needed by other modules
    AdminJwtStrategy,
  ],
})
export class AdminModule {}
