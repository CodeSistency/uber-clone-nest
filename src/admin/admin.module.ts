import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RouterModule } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminLocalStrategy } from './strategies/admin-local.strategy';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminJwtRefreshStrategy, JWT_REFRESH_STRATEGY_NAME } from './strategies/admin-jwt-refresh.strategy';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
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
  // Authentication & Profile
  {
    name: 'admin/auth',
    description: 'Admin authentication and authorization',
  },
  {
    name: 'admin/profile',
    description: 'Admin profile and account management',
  },

  // Core Management
  {
    name: 'admin/dashboard',
    description: 'Admin dashboard statistics and overview',
  },
  {
    name: 'admin/administration',
    description: 'System administration and settings',
  },

  // User Management
  {
    name: 'admin/users',
    description: 'End user management',
  },
  {
    name: 'admin/drivers',
    description: 'Driver management and verification',
  },
  {
    name: 'admin/merchants',
    description: 'Store and merchant management',
  },

  // Operations
  {
    name: 'admin/rides',
    description: 'Ride management and tracking',
  },
  {
    name: 'admin/reports',
    description: 'Analytics and reporting tools',
  },
];

@Module({
  imports: [
    // Core modules
    PrismaModule,
    AppConfigModule,
    
    // Authentication modules
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        },
      }),
    }),
    
    // Main admin routes
    RouterModule.register([
      {
        path: 'admin',
        children: [
          // Auth routes
          {
            path: 'auth',
            module: AdminAuthController,
          },
          // Dashboard routes
          {
            path: 'dashboard',
            module: DashboardModule,
          },
          // Admin management routes
          {
            path: 'administration',
            module: AdminManagementModule,
          },
          // Profile routes
          {
            path: 'profile',
            module: ProfileModule,
          },
          // User management routes
          {
            path: 'users',
            module: UserManagementModule,
          },
          // Driver management routes
          {
            path: 'drivers',
            module: DriverManagementModule,
          },
          // Ride management routes
          {
            path: 'rides',
            module: RideManagementModule,
          },
          // Store management routes
          {
            path: 'stores',
            module: StoreManagementModule,
          },
          // Reports routes
          {
            path: 'reports',
            module: ReportsModule,
          },
        ],
      },
    ]),
    
    // Feature modules
    DashboardModule,
    AdminManagementModule,
    ProfileModule,
    UserManagementModule,
    DriverManagementModule,
    RideManagementModule,
    StoreManagementModule,
    ReportsModule,
  ],
  controllers: [
    AdminAuthController, // Only keep auth controller in the main module
  ],
  providers: [
    AdminService,
    // Direct providers for all strategies
    AdminJwtStrategy,
    AdminJwtRefreshStrategy,
    AdminLocalStrategy,
    
    // Strategy providers with custom tokens
    {
      provide: 'JWT_STRATEGY',
      useClass: AdminJwtStrategy,
    },
    {
      provide: 'LOCAL_STRATEGY',
      useClass: AdminLocalStrategy,
    },
    {
      provide: JWT_REFRESH_STRATEGY_NAME,
      useClass: AdminJwtRefreshStrategy,
    },
    
    // Guards
    AdminAuthGuard,
    PermissionsGuard,
    
    // Global guards
    {
      provide: 'APP_GUARD',
      useClass: PermissionsGuard,
    },
  ],
  exports: [
    // Core services and guards
    AdminService,
    AdminAuthGuard,
    PermissionsGuard,
    
    // Strategies
    AdminJwtStrategy,
    AdminJwtRefreshStrategy,
    AdminLocalStrategy,
    
    // Modules
    JwtModule,
    PassportModule,
  ],
})
export class AdminModule {}


