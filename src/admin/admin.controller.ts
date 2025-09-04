import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { Permission } from './entities/admin.entity';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Controller('admin')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  // ===============================
  // DASHBOARD
  // ===============================

  @Get('dashboard/metrics')
  @RequirePermissions(Permission.REPORTS_VIEW)
  async getDashboardMetrics() {
    this.logger.log('Fetching dashboard metrics');
    return this.adminService.getDashboardMetrics();
  }

  // ===============================
  // GESTIÓN DE ADMINS
  // ===============================

  @Post('admins')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    this.logger.log(`Creating new admin: ${createAdminDto.email}`);
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get('admins')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  async getAllAdmins() {
    this.logger.log('Fetching all admins');
    return this.adminService.getAllAdmins();
  }

  @Get('admins/:id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  async getAdminById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching admin by ID: ${id}`);
    const admin = await this.adminService.findAdminById(id);
    if (!admin) {
      throw new Error('Admin not found');
    }
    return admin;
  }

  @Put('admins/:id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    this.logger.log(`Updating admin ID: ${id}`);
    return this.adminService.updateAdmin(id, updateAdminDto);
  }

  @Delete('admins/:id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  async deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Deleting admin ID: ${id}`);
    await this.adminService.deleteAdmin(id);
    return { message: 'Admin deleted successfully' };
  }

  // ===============================
  // PERFIL DEL ADMIN
  // ===============================

  @Get('profile')
  async getProfile() {
    // El admin ya está disponible en el request gracias al guard
    // TODO: Implementar lógica para obtener perfil completo
    this.logger.log('Fetching admin profile');
    return {
      message: 'Profile endpoint - to be implemented',
    };
  }

  @Put('profile')
  async updateProfile(@Body() updateProfileDto: any) {
    // TODO: Implementar actualización de perfil
    this.logger.log('Updating admin profile');
    return {
      message: 'Profile update endpoint - to be implemented',
    };
  }

  // ===============================
  // PLACEHOLDERS PARA FUNCIONALIDADES FUTURAS
  // ===============================

  @Get('test')
  async testAdminModule() {
    this.logger.log('Testing admin module functionality');
    return {
      message: 'Admin module is working!',
      timestamp: new Date(),
      module: 'AdminModule',
      status: 'active'
    };
  }

  @Get('users')
  @RequirePermissions(Permission.USER_READ)
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('userType') userType?: string,
  ) {
    this.logger.log(`Fetching users - page: ${page}, limit: ${limit}, search: ${search}`);

    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.isActive = status === 'active';
      }

      if (userType) {
        where.userType = userType;
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            adminRole: true,
            isActive: true,
            lastLogin: true,
            lastAdminLogin: true,
            createdAt: true,
            _count: {
              select: {
                rides: true,
                deliveryOrders: true,
                ratings: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching users:', error);
      return {
        success: false,
        message: 'Error fetching users',
        error: error.message,
      };
    }
  }

  @Get('users/:id')
  @RequirePermissions(Permission.USER_READ)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching user by ID: ${id}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          clerkId: true,
          userType: true,
          adminRole: true,
          adminPermissions: true,
          isActive: true,
          lastLogin: true,
          lastAdminLogin: true,
          createdAt: true,
          updatedAt: true,
          wallet: {
            select: {
              balance: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              rides: true,
              deliveryOrders: true,
              ratings: true,
              emergencyContacts: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error(`Error fetching user ${id}:`, error);
      return {
        success: false,
        message: 'Error fetching user',
        error: error.message,
      };
    }
  }

  @Put('users/:id/status')
  @RequirePermissions(Permission.USER_WRITE)
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    this.logger.log(`Updating user ${id} status to: ${isActive}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedUser,
      };
    } catch (error) {
      this.logger.error(`Error updating user ${id} status:`, error);
      return {
        success: false,
        message: 'Error updating user status',
        error: error.message,
      };
    }
  }

  @Delete('users/:id')
  @RequirePermissions(Permission.USER_DELETE)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Deleting user: ${id}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Soft delete - mark as inactive instead of hard delete
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: 'User deactivated successfully',
      };
    } catch (error) {
      this.logger.error(`Error deleting user ${id}:`, error);
      return {
        success: false,
        message: 'Error deleting user',
        error: error.message,
      };
    }
  }

  @Get('drivers')
  @RequirePermissions(Permission.DRIVER_READ)
  async getDrivers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('verificationStatus') verificationStatus?: string,
  ) {
    this.logger.log(`Fetching drivers - page: ${page}, limit: ${limit}, search: ${search}`);

    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { licensePlate: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (verificationStatus) {
        where.verificationStatus = verificationStatus;
      }

      const [drivers, total] = await Promise.all([
        this.prisma.driver.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            carModel: true,
            licensePlate: true,
            carSeats: true,
            status: true,
            verificationStatus: true,
            canDoDeliveries: true,
            createdAt: true,
            _count: {
              select: {
                rides: true,
                deliveryOrders: true,
                documents: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.driver.count({ where }),
      ]);

      return {
        success: true,
        data: drivers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching drivers:', error);
      return {
        success: false,
        message: 'Error fetching drivers',
        error: error.message,
      };
    }
  }

  @Get('drivers/:id')
  @RequirePermissions(Permission.DRIVER_READ)
  async getDriverById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching driver by ID: ${id}`);

    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
          carImageUrl: true,
          carModel: true,
          licensePlate: true,
          carSeats: true,
          status: true,
          verificationStatus: true,
          canDoDeliveries: true,
          createdAt: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              documentUrl: true,
              verificationStatus: true,
              uploadedAt: true,
            },
          },
          _count: {
            select: {
              rides: true,
              deliveryOrders: true,
            },
          },
        },
      });

      if (!driver) {
        return {
          success: false,
          message: 'Driver not found',
        };
      }

      return {
        success: true,
        data: driver,
      };
    } catch (error) {
      this.logger.error(`Error fetching driver ${id}:`, error);
      return {
        success: false,
        message: 'Error fetching driver',
        error: error.message,
      };
    }
  }

  @Put('drivers/:id/status')
  @RequirePermissions(Permission.DRIVER_WRITE)
  async updateDriverStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    this.logger.log(`Updating driver ${id} status to: ${status}`);

    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id },
      });

      if (!driver) {
        return {
          success: false,
          message: 'Driver not found',
        };
      }

      const updatedDriver = await this.prisma.driver.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: `Driver status updated to ${status}`,
        data: updatedDriver,
      };
    } catch (error) {
      this.logger.error(`Error updating driver ${id} status:`, error);
      return {
        success: false,
        message: 'Error updating driver status',
        error: error.message,
      };
    }
  }

  @Put('drivers/:id/verification')
  @RequirePermissions(Permission.DRIVER_APPROVE)
  async updateDriverVerification(
    @Param('id', ParseIntPipe) id: number,
    @Body('verificationStatus') verificationStatus: string,
    @Body('notes') notes?: string,
  ) {
    this.logger.log(`Updating driver ${id} verification to: ${verificationStatus}`);

    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id },
      });

      if (!driver) {
        return {
          success: false,
          message: 'Driver not found',
        };
      }

      const updatedDriver = await this.prisma.driver.update({
        where: { id },
        data: { verificationStatus },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          verificationStatus: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: `Driver verification updated to ${verificationStatus}`,
        data: updatedDriver,
      };
    } catch (error) {
      this.logger.error(`Error updating driver ${id} verification:`, error);
      return {
        success: false,
        message: 'Error updating driver verification',
        error: error.message,
      };
    }
  }

  @Get('rides')
  @RequirePermissions(Permission.RIDE_READ)
  async getRides(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('driverId') driverId?: number,
    @Query('userId') userId?: string,
  ) {
    this.logger.log(`Fetching rides - page: ${page}, limit: ${limit}`);

    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { originAddress: { contains: search, mode: 'insensitive' } },
          { destinationAddress: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        // Note: Ride model doesn't have status field, using paymentStatus as proxy
        where.paymentStatus = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (driverId) {
        where.driverId = driverId;
      }

      if (userId) {
        // Find user by clerkId and get their ID
        const user = await this.prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        if (user) {
          where.userId = userId;
        }
      }

      const [rides, total] = await Promise.all([
        this.prisma.ride.findMany({
          where,
          skip,
          take: limit,
          select: {
            rideId: true,
            originAddress: true,
            destinationAddress: true,
            farePrice: true,
            paymentStatus: true,
            driverId: true,
            userId: true,
            tierId: true,
            createdAt: true,
            driver: {
              select: {
                firstName: true,
                lastName: true,
                status: true,
              },
            },
            tier: {
              select: {
                name: true,
                baseFare: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.ride.count({ where }),
      ]);

      return {
        success: true,
        data: rides,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching rides:', error);
      return {
        success: false,
        message: 'Error fetching rides',
        error: error.message,
      };
    }
  }

  @Get('rides/:id')
  @RequirePermissions(Permission.RIDE_READ)
  async getRideById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching ride by ID: ${id}`);

    try {
      const ride = await this.prisma.ride.findUnique({
        where: { rideId: id },
        select: {
          rideId: true,
          originAddress: true,
          destinationAddress: true,
          originLatitude: true,
          originLongitude: true,
          destinationLatitude: true,
          destinationLongitude: true,
          rideTime: true,
          farePrice: true,
          paymentStatus: true,
          driverId: true,
          userId: true,
          tierId: true,
          createdAt: true,
          driver: {
            select: {
              firstName: true,
              lastName: true,
              carModel: true,
              licensePlate: true,
              status: true,
            },
          },
          tier: {
            select: {
              name: true,
              baseFare: true,
              perMinuteRate: true,
              perMileRate: true,
            },
          },
          messages: {
            select: {
              messageText: true,
              createdAt: true,
              sender: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
            take: 10,
          },
        },
      });

      if (!ride) {
        return {
          success: false,
          message: 'Ride not found',
        };
      }

      return {
        success: true,
        data: ride,
      };
    } catch (error) {
      this.logger.error(`Error fetching ride ${id}:`, error);
      return {
        success: false,
        message: 'Error fetching ride',
        error: error.message,
      };
    }
  }

  @Get('stores')
  @RequirePermissions(Permission.STORE_READ)
  async getStores(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isOpen') isOpen?: boolean,
  ) {
    this.logger.log(`Fetching stores - page: ${page}, limit: ${limit}, search: ${search}`);

    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (isOpen !== undefined) {
        where.isOpen = isOpen;
      }

      const [stores, total] = await Promise.all([
        this.prisma.store.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            address: true,
            category: true,
            cuisineType: true,
            rating: true,
            isOpen: true,
            ownerClerkId: true,
            createdAt: true,
            _count: {
              select: {
                products: true,
                deliveryOrders: true,
                ratings: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.store.count({ where }),
      ]);

      return {
        success: true,
        data: stores,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching stores:', error);
      return {
        success: false,
        message: 'Error fetching stores',
        error: error.message,
      };
    }
  }

  @Get('stores/:id')
  @RequirePermissions(Permission.STORE_READ)
  async getStoreById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching store by ID: ${id}`);

    try {
      const store = await this.prisma.store.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          category: true,
          cuisineType: true,
          logoUrl: true,
          rating: true,
          isOpen: true,
          ownerClerkId: true,
          createdAt: true,
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              isAvailable: true,
            },
            take: 5,
          },
          _count: {
            select: {
              products: true,
              deliveryOrders: true,
              ratings: true,
            },
          },
        },
      });

      if (!store) {
        return {
          success: false,
          message: 'Store not found',
        };
      }

      return {
        success: true,
        data: store,
      };
    } catch (error) {
      this.logger.error(`Error fetching store ${id}:`, error);
      return {
        success: false,
        message: 'Error fetching store',
        error: error.message,
      };
    }
  }

  @Put('stores/:id/status')
  @RequirePermissions(Permission.STORE_WRITE)
  async updateStoreStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isOpen') isOpen: boolean,
  ) {
    this.logger.log(`Updating store ${id} status to: ${isOpen ? 'open' : 'closed'}`);

    try {
      const store = await this.prisma.store.findUnique({
        where: { id },
      });

      if (!store) {
        return {
          success: false,
          message: 'Store not found',
        };
      }

      const updatedStore = await this.prisma.store.update({
        where: { id },
        data: { isOpen },
        select: {
          id: true,
          name: true,
          isOpen: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: `Store ${isOpen ? 'opened' : 'closed'} successfully`,
        data: updatedStore,
      };
    } catch (error) {
      this.logger.error(`Error updating store ${id} status:`, error);
      return {
        success: false,
        message: 'Error updating store status',
        error: error.message,
      };
    }
  }

  @Get('reports/:type')
  @RequirePermissions(Permission.REPORTS_VIEW)
  async getReport(@Param('type') type: string, @Query() query: any) {
    this.logger.log(`Fetching report: ${type}`);

    try {
      let reportData: any = {};

      switch (type) {
        case 'users':
          const userStats = await this.prisma.user.aggregate({
            _count: { id: true },
            where: { userType: 'user' },
          });

          const adminStats = await this.prisma.user.aggregate({
            _count: { id: true },
            where: { userType: 'admin' },
          });

          reportData = {
            totalUsers: userStats._count.id,
            totalAdmins: adminStats._count.id,
            userGrowth: await this.getUserGrowthReport(),
          };
          break;

        case 'rides':
          const rideStats = await this.prisma.ride.aggregate({
            _count: { rideId: true },
            _sum: { farePrice: true },
            where: { paymentStatus: 'completed' },
          });

          reportData = {
            totalRides: rideStats._count.rideId,
            totalRevenue: rideStats._sum.farePrice || 0,
            averageFare: rideStats._count.rideId > 0
              ? Number(rideStats._sum.farePrice || 0) / rideStats._count.rideId
              : 0,
            rideTrends: await this.getRideTrendsReport(),
          };
          break;

        case 'drivers':
          const driverStats = await this.prisma.driver.aggregate({
            _count: { id: true },
          });

          const onlineDrivers = await this.prisma.driver.count({
            where: { status: 'online' },
          });

          const verifiedDrivers = await this.prisma.driver.count({
            where: { verificationStatus: 'approved' },
          });

          reportData = {
            totalDrivers: driverStats._count.id,
            onlineDrivers,
            verifiedDrivers,
            driverPerformance: await this.getDriverPerformanceReport(),
          };
          break;

        case 'financial':
          const walletBalance = await this.prisma.wallet.aggregate({
            _sum: { balance: true },
          });

          const transactionVolume = await this.prisma.walletTransaction.aggregate({
            _sum: { amount: true },
            where: { transactionType: 'credit' },
          });

          reportData = {
            totalWalletBalance: walletBalance._sum.balance || 0,
            transactionVolume: transactionVolume._sum.amount || 0,
            revenueByService: await this.getRevenueByServiceReport(),
          };
          break;

        default:
          return {
            success: false,
            message: `Report type '${type}' not found`,
            availableReports: ['users', 'rides', 'drivers', 'financial'],
          };
      }

      return {
        success: true,
        reportType: type,
        data: reportData,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error generating report ${type}:`, error);
      return {
        success: false,
        message: 'Error generating report',
        error: error.message,
      };
    }
  }

  // ===============================
  // HELPER METHODS FOR REPORTS
  // ===============================

  private async getUserGrowthReport() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [thisWeek, lastWeekCount, thisMonth, lastMonthCount] = await Promise.all([
      this.prisma.user.count({
        where: {
          userType: 'user',
          createdAt: { gte: lastWeek }
        },
      }),
      this.prisma.user.count({
        where: {
          userType: 'user',
          createdAt: { gte: lastMonth, lt: lastWeek }
        },
      }),
      this.prisma.user.count({
        where: {
          userType: 'user',
          createdAt: { gte: lastMonth }
        },
      }),
      this.prisma.user.count({
        where: {
          userType: 'user',
          createdAt: { lt: lastMonth }
        },
      }),
    ]);

    return {
      weeklyGrowth: thisWeek - lastWeekCount,
      monthlyGrowth: thisMonth - lastMonthCount,
      growthRate: lastMonthCount > 0 ? ((thisMonth - lastMonthCount) / lastMonthCount) * 100 : 0,
    };
  }

  private async getRideTrendsReport() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [thisWeekRides, lastWeekRides, thisMonthRides, lastMonthRides] = await Promise.all([
      this.prisma.ride.count({
        where: { createdAt: { gte: lastWeek } },
      }),
      this.prisma.ride.count({
        where: { createdAt: { gte: lastMonth, lt: lastWeek } },
      }),
      this.prisma.ride.count({
        where: { createdAt: { gte: lastMonth } },
      }),
      this.prisma.ride.count({
        where: { createdAt: { lt: lastMonth } },
      }),
    ]);

    return {
      weeklyRides: thisWeekRides,
      weeklyChange: thisWeekRides - lastWeekRides,
      monthlyRides: thisMonthRides,
      monthlyChange: thisMonthRides - lastMonthRides,
    };
  }

  private async getDriverPerformanceReport() {
    const topDrivers = await this.prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true,
        _count: {
          select: {
            rides: true,
            deliveryOrders: true,
          },
        },
      },
      orderBy: {
        rides: { _count: 'desc' },
      },
      take: 10,
    });

    return {
      topDrivers,
      totalActiveDrivers: await this.prisma.driver.count({
        where: { status: 'online' },
      }),
    };
  }

  private async getRevenueByServiceReport() {
    const [rideRevenue, deliveryRevenue] = await Promise.all([
      this.prisma.ride.aggregate({
        _sum: { farePrice: true },
        where: { paymentStatus: 'completed' },
      }),
      this.prisma.deliveryOrder.aggregate({
        _sum: { totalPrice: true },
        where: { paymentStatus: 'completed' },
      }),
    ]);

    return {
      rides: rideRevenue._sum.farePrice || 0,
      delivery: deliveryRevenue._sum.totalPrice || 0,
      total: Number(rideRevenue._sum.farePrice || 0) + Number(deliveryRevenue._sum.totalPrice || 0),
    };
  }
}
