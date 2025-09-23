import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Admin, AdminRole, Permission } from './entities/admin.entity';
import { AdminJwtPayload, AuthenticatedAdmin } from './interfaces/admin.interface';
import { DashboardMetrics } from './modules/dashboard/dtos/metrics.dto';
import { CreateAdminDto, CreateAdminResponseDto } from './dto/create-admin.dto';
import { UpdateAdminDto, UpdateAdminResponseDto } from './dto/update-admin.dto';
import { AdminLoginDto, AdminLoginResponseDto } from './dto/admin-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ===============================
  // AUTENTICACIÓN
  // ===============================

  /**
   * Validates an admin's credentials
   * @param email Admin's email
   * @param password Admin's password
   * @returns The admin if credentials are valid, null otherwise
   */
  async validateAdmin(email: string, password: string): Promise<any> {
    this.logger.debug(`Validating admin with email: ${email}`);
    
    // Buscar usuario por email y verificar que sea admin
    const user = await this.prisma.user.findUnique({
      where: { email, userType: 'admin' },
    });

    if (!user) {
      this.logger.warn(`No admin found with email: ${email}`);
      return null;
    }

    // Verificar si está activo
    if (!user.isActive) {
      this.logger.warn(`Admin account is deactivated: ${email}`);
      return null;
    }

    // Verificar contraseña
    if (!user.password) {
      this.logger.warn(`No password set for admin: ${email}`);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for admin: ${email}`);
      return null;
    }

    this.logger.debug(`Admin validated successfully: ${email}`);
    return user;
  }

  /**
   * Refresh access and refresh tokens
   * @param user User information from refresh token
   * @returns New access and refresh tokens with admin info
   */
  /**
   * Authenticate admin user with email and password
   * @param loginDto Login credentials
   * @returns Access and refresh tokens with admin info
   */
  async login(loginDto: { email: string; password: string }): Promise<AdminLoginResponseDto> {
    const { email, password } = loginDto;
    
    this.logger.debug(`[Login] Attempting login for admin: ${email}`);
    
    try {
      // Find admin by email
      const admin = await this.prisma.user.findFirst({
        where: { 
          email: email.toLowerCase().trim(),
          userType: 'admin'
        }
      });

      if (!admin) {
        this.logger.warn(`[Login] No admin found with email: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      this.logger.debug(`[Login] Admin found - ID: ${admin.id}, Active: ${admin.isActive}, Has Password: ${!!admin.password}`);

      if (!admin.isActive) {
        this.logger.warn(`[Login] Account is deactivated for: ${email}`);
        throw new UnauthorizedException('This account has been deactivated');
      }

      if (!admin.password) {
        this.logger.warn(`[Login] No password set for admin: ${email}`);
        throw new UnauthorizedException('Account not properly configured');
      }

      // Verify password
      this.logger.debug(`[Login] Verifying password for: ${admin.email}`);
      this.logger.debug(`[Login] Password length: ${password ? password.length : 0} chars`);
      
      // Normalize password input
      const normalizedPassword = password.trim();
      
      // Log password comparison details (without logging actual password)
      this.logger.debug(`[Login] Comparing password with stored hash...`);
      
      const isPasswordValid = await bcrypt.compare(normalizedPassword, admin.password);
      
      if (!isPasswordValid) {
        // Check for common issues
        if (password !== normalizedPassword) {
          this.logger.warn(`[Login] Password contains leading/trailing whitespace`);
        }
        
        // Check if it's a case sensitivity issue
        const lowerCasePassword = password.toLowerCase();
        const upperCasePassword = password.toUpperCase();
        const isCaseSensitive = (password !== lowerCasePassword || password !== upperCasePassword);
        
        if (isCaseSensitive) {
          this.logger.warn(`[Login] Password might have case sensitivity issues`);
        }
        
        this.logger.warn(`[Login] Invalid password for admin: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }
      
      this.logger.debug(`[Login] Password verified successfully for: ${email}`);

      // Generate tokens
      const payload: AdminJwtPayload = {
        sub: admin.id.toString(),
        email: admin.email,
        role: (admin.adminRole as AdminRole) || AdminRole.ADMIN,
        permissions: (admin.adminPermissions || []) as Permission[],
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
      });

      // Update last login timestamps
      await this.prisma.user.update({
        where: { id: admin.id },
        data: {
          lastLogin: new Date(),
          lastAdminLogin: new Date(),
          // Store refresh token hash in the password field (temporarily)
          password: await bcrypt.hash(refreshToken, 10)
        }
      });

      return {
        accessToken,
        refreshToken,
        admin: {
          id: admin.id.toString(), // Keep as string to match AdminInfoDto
          name: admin.name,
          email: admin.email,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin || new Date(),
          userType: admin.userType as 'user' | 'admin',
          adminRole: admin.adminRole as AdminRole,
          adminPermissions: (admin.adminPermissions || []) as Permission[],
          lastAdminLogin: admin.lastAdminLogin || new Date(),
          profileImage: admin.profileImage || null,
          phone: admin.phone || null,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        },
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10) // 1 hour default
      };
    } catch (error) {
      this.logger.error(`[Login] Error during login for ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Refresh access and refresh tokens
   * @param user User information from refresh token
   * @returns New access and refresh tokens with admin info
   */
  async refreshTokens(user: { id: string; email: string; role: AdminRole; refreshToken: string }): Promise<AdminLoginResponseDto> {
    // Find the admin user
    const admin = await this.prisma.user.findUnique({
      where: { 
        id: parseInt(user.id), // Convert string ID to number as per Prisma schema
        userType: 'admin',
        isActive: true
      }
    });

    if (!admin) {
      throw new UnauthorizedException('Access Denied');
    }

    // Generate new tokens
    const payload: AdminJwtPayload = {
      sub: admin.id.toString(),
      email: admin.email,
      role: (admin.adminRole as AdminRole) || AdminRole.ADMIN,
      permissions: (admin.adminPermissions || []) as Permission[],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    this.logger.log(`Admin ${admin.email} refreshed tokens successfully`);

    // Update the refresh token in the database
    await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        // Store the hashed refresh token in the password field (temporarily)
        password: await bcrypt.hash(refreshToken, 10),
        lastLogin: new Date(),
        lastAdminLogin: new Date()
      }
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id.toString(), // Keep as string to match AdminInfoDto
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin || new Date(),
        userType: admin.userType as 'user' | 'admin',
        adminRole: admin.adminRole as AdminRole,
        adminPermissions: (admin.adminPermissions || []) as Permission[],
        lastAdminLogin: admin.lastAdminLogin || new Date(),
        profileImage: admin.profileImage || null,
        phone: admin.phone || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10) // 1 hour default
    };
  }

  // Método de prueba para verificar que JWT esté funcionando
  async generateTestToken(payload: any): Promise<string> {
    try {
      return this.jwtService.sign(payload, { expiresIn: '1m' }); // Token de 1 minuto para testing
    } catch (error) {
      this.logger.error('Error generating test token:', error);
      throw error;
    }
  }

  // ===============================
  // GESTIÓN DE ADMINS
  // ===============================

  async createAdmin(createAdminDto: CreateAdminDto): Promise<CreateAdminResponseDto> {
    const { name, email, password, adminRole, adminPermissions, isActive = true } = createAdminDto;

    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Asignar permisos por defecto basados en el rol si no se especifican
    let defaultPermissions: Permission[] = [];
    if (!adminPermissions) {
      defaultPermissions = this.getDefaultPermissionsForRole(adminRole);
    }

    // Crear admin user
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType: 'admin',
        adminRole,
        adminPermissions: adminPermissions || defaultPermissions,
        isActive,
        adminCreatedAt: new Date(),
      },
    });

    this.logger.log(`Admin ${email} created by system`);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType as 'user' | 'admin',
      adminRole: user.adminRole as AdminRole,
      adminPermissions: user.adminPermissions as Permission[],
      isActive: user.isActive,
      adminCreatedAt: user.adminCreatedAt,
    };
  }

  async findAdminById(id: number | string): Promise<AuthenticatedAdmin | null> {
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(userId)) {
      return null;
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.userType !== 'admin') return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType as 'user' | 'admin',
      adminRole: user.adminRole as AdminRole,
      adminPermissions: (user.adminPermissions || []) as Permission[],
      lastAdminLogin: user.lastAdminLogin || null,
      isActive: user.isActive,
    };
  }

  async findAdminByEmail(email: string): Promise<Admin | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        adminAuditLogs: true,
      },
    });

    if (!user || user.userType !== 'admin') return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      userType: user.userType as 'user' | 'admin' | null,
      adminRole: user.adminRole as AdminRole | null,
      adminPermissions: user.adminPermissions as Permission[],
      lastAdminLogin: user.lastAdminLogin,
      adminCreatedAt: user.adminCreatedAt,
      adminUpdatedAt: user.adminUpdatedAt,
      adminAuditLogs: user.adminAuditLogs,
    };
  }

  async updateAdmin(id: number, updateAdminDto: UpdateAdminDto): Promise<UpdateAdminResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.userType !== 'admin') {
      throw new NotFoundException('Admin not found');
    }

    // Hash de la nueva contraseña si se proporciona
    let hashedPassword = user.password;
    if (updateAdminDto.password) {
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(updateAdminDto.password, saltRounds);
    }

    // Asignar permisos por defecto si se cambia el rol y no se especifican permisos
    let adminPermissions = updateAdminDto.adminPermissions;
    if (updateAdminDto.adminRole && !updateAdminDto.adminPermissions) {
      adminPermissions = this.getDefaultPermissionsForRole(updateAdminDto.adminRole);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateAdminDto,
        password: hashedPassword,
        adminPermissions,
        adminUpdatedAt: new Date(),
      },
    });

    this.logger.log(`Admin ${updatedUser.email} updated`);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      userType: updatedUser.userType as 'user' | 'admin',
      adminRole: updatedUser.adminRole as AdminRole,
      adminPermissions: updatedUser.adminPermissions as Permission[],
      isActive: updatedUser.isActive,
      adminUpdatedAt: updatedUser.adminUpdatedAt || null,
    };
  }

  async deleteAdmin(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.userType !== 'admin') {
      throw new NotFoundException('Admin not found');
    }

    // Convertir a usuario normal en lugar de eliminar
    await this.prisma.user.update({
      where: { id },
      data: {
        userType: 'user',
        adminRole: null,
        adminPermissions: [],
        adminUpdatedAt: new Date(),
      },
    });

    this.logger.log(`Admin ${user.email} converted to regular user`);
  }

  async getAllAdmins(): Promise<Admin[]> {
    const users = await this.prisma.user.findMany({
      where: { userType: 'admin' },
      include: {
        adminAuditLogs: true,
      },
      orderBy: { adminCreatedAt: 'desc' },
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      userType: user.userType as 'user' | 'admin' | null,
      adminRole: user.adminRole as AdminRole | null,
      adminPermissions: user.adminPermissions as Permission[],
      lastAdminLogin: user.lastAdminLogin,
      adminCreatedAt: user.adminCreatedAt,
      adminUpdatedAt: user.adminUpdatedAt,
      adminAuditLogs: user.adminAuditLogs,
    }));
  }

  // ===============================
  // DASHBOARD Y MÉTRICAS
  // ===============================

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Usuarios
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    ]);

    // Drivers
    const [
      totalDrivers,
      onlineDrivers,
      pendingVerifications,
      approvedDrivers,
      suspendedDrivers,
    ] = await Promise.all([
      this.prisma.driver.count(),
      this.prisma.driver.count({ where: { status: 'online' } }),
      this.prisma.driver.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.driver.count({ where: { verificationStatus: 'approved' } }),
      this.prisma.driver.count({ where: { status: 'suspended' } }),
    ]);

    // Rides
    const [
      activeRides,
      completedRidesToday,
      cancelledRidesToday,
      completedRidesThisWeek,
      totalRides,
    ] = await Promise.all([
      this.prisma.ride.count({ where: { paymentStatus: 'pending' } }),
      this.prisma.ride.count({
        where: {
          paymentStatus: 'completed',
          createdAt: { gte: today }
        }
      }),
      this.prisma.ride.count({
        where: {
          paymentStatus: 'cancelled',
          createdAt: { gte: today }
        }
      }),
      this.prisma.ride.count({
        where: {
          paymentStatus: 'completed',
          createdAt: { gte: weekAgo }
        }
      }),
      this.prisma.ride.count(),
    ]);

    // Delivery Orders
    const [
      activeOrders,
      completedOrdersToday,
      completedOrdersThisWeek,
      totalOrders,
    ] = await Promise.all([
      this.prisma.deliveryOrder.count({ where: { status: 'in_transit' } }),
      this.prisma.deliveryOrder.count({
        where: {
          status: 'delivered',
          createdAt: { gte: today }
        }
      }),
      this.prisma.deliveryOrder.count({
        where: {
          status: 'delivered',
          createdAt: { gte: weekAgo }
        }
      }),
      this.prisma.deliveryOrder.count(),
    ]);

    // Financial
    const [
      totalRevenue,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      pendingPayments,
      totalWalletBalance,
    ] = await Promise.all([
      this.prisma.ride.aggregate({
        _sum: { farePrice: true },
        where: { paymentStatus: 'completed' }
      }).then(result => Number(result._sum.farePrice) || 0),
      this.prisma.ride.aggregate({
        _sum: { farePrice: true },
        where: {
          paymentStatus: 'completed',
          createdAt: { gte: today }
        }
      }).then(result => Number(result._sum.farePrice) || 0),
      this.prisma.ride.aggregate({
        _sum: { farePrice: true },
        where: {
          paymentStatus: 'completed',
          createdAt: { gte: weekAgo }
        }
      }).then(result => Number(result._sum.farePrice) || 0),
      this.prisma.ride.aggregate({
        _sum: { farePrice: true },
        where: {
          paymentStatus: 'completed',
          createdAt: { gte: monthAgo }
        }
      }).then(result => Number(result._sum.farePrice) || 0),
      this.prisma.ride.count({ where: { paymentStatus: 'pending' } }),
      this.prisma.wallet.aggregate({
        _sum: { balance: true }
      }).then(result => Number(result._sum.balance) || 0),
    ]);

    // Stores
    const [
      totalStores,
      activeStores,
      pendingStores,
    ] = await Promise.all([
      this.prisma.store.count(),
      this.prisma.store.count({ where: { isOpen: true } }),
      this.prisma.store.count({ where: { isOpen: false } }),
    ]);

    // Notifications
    const totalNotificationsSent = await this.prisma.notification.count();

    return {
      // Usuarios
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,

      // Drivers
      totalDrivers,
      onlineDrivers,
      pendingVerifications,
      approvedDrivers,
      suspendedDrivers,

      // Rides
      activeRides,
      completedRidesToday,
      cancelledRidesToday,
      completedRidesThisWeek,
      totalRides,

      // Delivery
      activeOrders,
      completedOrdersToday,
      completedOrdersThisWeek,
      totalOrders,

      // Financial
      totalRevenue,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      pendingPayments,
      totalWalletBalance,

      // Stores
      totalStores,
      activeStores,
      pendingStores,

      // System
      totalNotificationsSent,
      systemUptime: '99.9%', // Placeholder - implementar con health check
    };
  }

  // ===============================
  // HELPERS
  // ===============================

  private getDefaultPermissionsForRole(role: AdminRole): Permission[] {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return [
          Permission.USER_READ,
          Permission.USER_WRITE,
          Permission.USER_DELETE,
          Permission.DRIVER_APPROVE,
          Permission.DRIVER_SUSPEND,
          Permission.DRIVER_READ,
          Permission.DRIVER_WRITE,
          Permission.RIDE_MONITOR,
          Permission.RIDE_INTERVENE,
          Permission.RIDE_READ,
          Permission.RIDE_WRITE,
          Permission.DELIVERY_READ,
          Permission.DELIVERY_WRITE,
          Permission.DELIVERY_MONITOR,
          Permission.PAYMENT_REFUND,
          Permission.WALLET_MANAGE,
          Permission.FINANCIAL_READ,
          Permission.SYSTEM_CONFIG,
          Permission.REPORTS_VIEW,
          Permission.LOGS_VIEW,
          Permission.STORE_READ,
          Permission.STORE_WRITE,
          Permission.STORE_APPROVE,
          Permission.PRODUCT_READ,
          Permission.PRODUCT_WRITE,
          Permission.NOTIFICATION_SEND,
          Permission.NOTIFICATION_READ,
        ];

      case AdminRole.ADMIN:
        return [
          Permission.USER_READ,
          Permission.USER_WRITE,
          Permission.DRIVER_APPROVE,
          Permission.DRIVER_READ,
          Permission.DRIVER_WRITE,
          Permission.RIDE_MONITOR,
          Permission.RIDE_READ,
          Permission.RIDE_WRITE,
          Permission.DELIVERY_READ,
          Permission.DELIVERY_WRITE,
          Permission.DELIVERY_MONITOR,
          Permission.FINANCIAL_READ,
          Permission.REPORTS_VIEW,
          Permission.STORE_READ,
          Permission.STORE_WRITE,
          Permission.STORE_APPROVE,
          Permission.PRODUCT_READ,
          Permission.PRODUCT_WRITE,
          Permission.NOTIFICATION_SEND,
          Permission.NOTIFICATION_READ,
        ];

      case AdminRole.MODERATOR:
        return [
          Permission.USER_READ,
          Permission.DRIVER_READ,
          Permission.RIDE_MONITOR,
          Permission.RIDE_READ,
          Permission.DELIVERY_READ,
          Permission.DELIVERY_MONITOR,
          Permission.REPORTS_VIEW,
          Permission.STORE_READ,
          Permission.PRODUCT_READ,
          Permission.NOTIFICATION_READ,
        ];

      case AdminRole.SUPPORT:
        return [
          Permission.USER_READ,
          Permission.DRIVER_READ,
          Permission.RIDE_READ,
          Permission.DELIVERY_READ,
          Permission.NOTIFICATION_SEND,
          Permission.NOTIFICATION_READ,
        ];

      default:
        return [];
    }
  }
}
