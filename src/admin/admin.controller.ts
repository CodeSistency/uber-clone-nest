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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
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
@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Retrieve comprehensive dashboard metrics including users, drivers, rides, deliveries, and financial data'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        activeUsers: { type: 'number', example: 120 },
        newUsersToday: { type: 'number', example: 5 },
        totalDrivers: { type: 'number', example: 45 },
        onlineDrivers: { type: 'number', example: 32 },
        activeRides: { type: 'number', example: 8 },
        completedRidesToday: { type: 'number', example: 127 },
        totalRevenue: { type: 'number', example: 15420.50 },
        revenueToday: { type: 'number', example: 2340.75 }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getDashboardMetrics() {
    this.logger.log('Fetching dashboard metrics');
    return this.adminService.getDashboardMetrics();
  }

  // ===============================
  // GESTIÓN DE ADMINS
  // ===============================

  @Post('admins')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Create new admin',
    description: 'Create a new administrator account with specified role and permissions'
  })
  @ApiBody({
    type: CreateAdminDto,
    description: 'Admin creation data including name, email, password, role and permissions'
  })
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'admin@uberclone.com' },
        userType: { type: 'string', example: 'admin' },
        adminRole: { type: 'string', example: 'admin' },
        adminPermissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['user:read', 'user:write']
        },
        isActive: { type: 'boolean', example: true },
        adminCreatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid data or validation error' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    this.logger.log(`Creating new admin: ${createAdminDto.email}`);
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get('admins')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Get all admins',
    description: 'Retrieve a list of all administrator accounts with their roles and permissions'
  })
  @ApiResponse({
    status: 200,
    description: 'Admins list retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'admin@uberclone.com' },
          adminRole: { type: 'string', example: 'admin' },
          adminPermissions: {
            type: 'array',
            items: { type: 'string' },
            example: ['user:read', 'user:write']
          },
          isActive: { type: 'boolean', example: true },
          lastAdminLogin: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getAllAdmins() {
    this.logger.log('Fetching all admins');
    return this.adminService.getAllAdmins();
  }

  @Get('admins/:id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Get admin by ID',
    description: 'Retrieve detailed information about a specific administrator account'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Admin ID to retrieve',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Admin details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'admin@uberclone.com' },
        adminRole: { type: 'string', example: 'admin' },
        adminPermissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['user:read', 'user:write']
        },
        isActive: { type: 'boolean', example: true },
        lastAdminLogin: { type: 'string', format: 'date-time' },
        adminCreatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Update admin',
    description: 'Update an administrator account information, role, or permissions'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Admin ID to update',
    example: 1
  })
  @ApiBody({
    type: UpdateAdminDto,
    description: 'Admin update data'
  })
  @ApiResponse({
    status: 200,
    description: 'Admin updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Doe Updated' },
        email: { type: 'string', example: 'admin@uberclone.com' },
        adminRole: { type: 'string', example: 'admin' },
        adminPermissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['user:read', 'user:write', 'user:delete']
        },
        isActive: { type: 'boolean', example: true },
        adminUpdatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid data or validation error' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    this.logger.log(`Updating admin ID: ${id}`);
    return this.adminService.updateAdmin(id, updateAdminDto);
  }

  @Delete('admins/:id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Delete admin',
    description: 'Convert an administrator account to a regular user account (soft delete)'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Admin ID to delete',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Admin converted to regular user successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Admin deleted successfully' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Deleting admin ID: ${id}`);
    await this.adminService.deleteAdmin(id);
    return { message: 'Admin deleted successfully' };
  }

  // ===============================
  // PERFIL DEL ADMIN
  // ===============================

  @Get('profile')
  @ApiOperation({
    summary: 'Get admin profile',
    description: 'Retrieve the current authenticated admin profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'Admin profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'admin@uberclone.com' },
        adminRole: { type: 'string', example: 'admin' },
        adminPermissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['user:read', 'user:write']
        },
        lastAdminLogin: { type: 'string', format: 'date-time' },
        adminCreatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getProfile() {
    // El admin ya está disponible en el request gracias al guard
    // TODO: Implementar lógica para obtener perfil completo
    this.logger.log('Fetching admin profile');
    return {
      message: 'Profile endpoint - to be implemented',
    };
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update admin profile',
    description: 'Update the current authenticated admin profile information'
  })
  @ApiBody({
    description: 'Profile update data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe Updated' },
        email: { type: 'string', example: 'newemail@uberclone.com' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Profile update endpoint - to be implemented',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile update endpoint - to be implemented' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
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
  @ApiOperation({
    summary: 'Test admin module',
    description: 'Test endpoint to verify admin module functionality'
  })
  @ApiResponse({
    status: 200,
    description: 'Admin module test successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Admin module is working!' },
        timestamp: { type: 'string', format: 'date-time' },
        module: { type: 'string', example: 'AdminModule' },
        status: { type: 'string', example: 'active' },
        database: { type: 'string', example: 'connected' },
        jwt: { type: 'string', example: 'configured' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async testAdminModule() {
    this.logger.log('Testing admin module functionality');

    // Verificar conexión a base de datos
    let dbStatus = 'unknown';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'disconnected';
      this.logger.error('Database connection test failed:', error);
    }

    return {
      message: 'Admin module is working!',
      timestamp: new Date(),
      module: 'AdminModule',
      status: 'active',
      database: dbStatus,
      jwt: process.env.JWT_SECRET ? 'configured' : 'not_configured'
    };
  }

  @Get('users')
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({
    summary: 'Get users with filters',
    description: 'Retrieve a paginated list of users with advanced filtering and search capabilities'
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of users per page',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search term for name or email',
    example: 'john'
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
    description: 'User status filter',
    example: 'active'
  })
  @ApiQuery({
    name: 'userType',
    type: 'string',
    required: false,
    description: 'User type filter',
    example: 'user'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john@example.com' },
              userType: { type: 'string', example: 'user' },
              isActive: { type: 'boolean', example: true },
              lastLogin: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 150 },
            pages: { type: 'number', example: 15 }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user including wallet balance and activity counts'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID to retrieve',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            userType: { type: 'string', example: 'user' },
            isActive: { type: 'boolean', example: true },
            wallet: {
              type: 'object',
              properties: {
                balance: { type: 'number', example: 50.00 }
              }
            },
            _count: {
              type: 'object',
              properties: {
                rides: { type: 'number', example: 15 },
                deliveryOrders: { type: 'number', example: 5 },
                ratings: { type: 'number', example: 12 }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching user by ID: ${id}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
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
  @ApiOperation({
    summary: 'Update user status',
    description: 'Activate or deactivate a user account'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID to update',
    example: 1
  })
  @ApiBody({
    description: 'User status update data',
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', example: false, description: 'Whether the user account should be active' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User deactivated successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            isActive: { type: 'boolean', example: false },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid data or validation error' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft delete a user account by deactivating it'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID to delete',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User deactivated successfully' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Get drivers with filters',
    description: 'Retrieve a paginated list of drivers with advanced filtering and search capabilities'
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of drivers per page',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search term for name, email, or license plate',
    example: 'john'
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
    description: 'Driver status filter',
    example: 'online'
  })
  @ApiQuery({
    name: 'verificationStatus',
    type: 'string',
    required: false,
    description: 'Driver verification status filter',
    example: 'approved'
  })
  @ApiResponse({
    status: 200,
    description: 'Drivers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              firstName: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              email: { type: 'string', example: 'john@example.com' },
              status: { type: 'string', example: 'online' },
              verificationStatus: { type: 'string', example: 'approved' },
              carModel: { type: 'string', example: 'Toyota Camry' },
              licensePlate: { type: 'string', example: 'ABC123' },
              carSeats: { type: 'number', example: 4 },
              canDoDeliveries: { type: 'boolean', example: true }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 45 },
            pages: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Get driver by ID',
    description: 'Retrieve detailed information about a specific driver including vehicle details and documents'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Driver ID to retrieve',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Driver details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john@example.com' },
            status: { type: 'string', example: 'online' },
            verificationStatus: { type: 'string', example: 'approved' },
            carModel: { type: 'string', example: 'Toyota Camry' },
            licensePlate: { type: 'string', example: 'ABC123' },
            carSeats: { type: 'number', example: 4 },
            canDoDeliveries: { type: 'boolean', example: true },
            documents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  documentType: { type: 'string', example: 'license' },
                  documentUrl: { type: 'string', example: 'https://example.com/doc1.jpg' },
                  verificationStatus: { type: 'string', example: 'approved' }
                }
              }
            },
            _count: {
              type: 'object',
              properties: {
                rides: { type: 'number', example: 25 },
                deliveryOrders: { type: 'number', example: 8 }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Update driver status',
    description: 'Update the operational status of a driver (online, offline, suspended, etc.)'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Driver ID to update',
    example: 1
  })
  @ApiBody({
    description: 'Driver status update data',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'suspended',
          enum: ['online', 'offline', 'suspended', 'inactive'],
          description: 'New status for the driver'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Driver status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Driver status updated to suspended' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            status: { type: 'string', example: 'suspended' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid status value' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Update driver verification status',
    description: 'Approve or reject driver verification with optional notes'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Driver ID to update verification',
    example: 1
  })
  @ApiBody({
    description: 'Driver verification update data',
    schema: {
      type: 'object',
      properties: {
        verificationStatus: {
          type: 'string',
          example: 'approved',
          enum: ['pending', 'approved', 'rejected', 'needs_review'],
          description: 'New verification status'
        },
        notes: {
          type: 'string',
          example: 'Documents verified successfully',
          description: 'Optional notes about the verification decision'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Driver verification updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Driver verification updated to approved' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            verificationStatus: { type: 'string', example: 'approved' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid verification status' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Get rides with filters',
    description: 'Retrieve a paginated list of rides with advanced filtering and search capabilities'
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of rides per page',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search term for addresses',
    example: 'downtown'
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
    description: 'Payment status filter',
    example: 'completed'
  })
  @ApiQuery({
    name: 'paymentStatus',
    type: 'string',
    required: false,
    description: 'Payment status filter',
    example: 'completed'
  })
  @ApiQuery({
    name: 'driverId',
    type: 'number',
    required: false,
    description: 'Filter by driver ID',
    example: 5
  })
  @ApiQuery({
    name: 'userId',
    type: 'string',
    required: false,
    description: 'Filter by user ID',
    example: 'user123'
  })
  @ApiResponse({
    status: 200,
    description: 'Rides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rideId: { type: 'number', example: 1001 },
              originAddress: { type: 'string', example: '123 Main St' },
              destinationAddress: { type: 'string', example: '456 Oak Ave' },
              farePrice: { type: 'number', example: 25.50 },
              paymentStatus: { type: 'string', example: 'completed' },
              driverId: { type: 'number', example: 5 },
              userId: { type: 'string', example: 'user123' },
              createdAt: { type: 'string', format: 'date-time' },
              driver: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  status: { type: 'string', example: 'online' }
                }
              },
              tier: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'UberX' },
                  baseFare: { type: 'number', example: 2.50 }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 150 },
            pages: { type: 'number', example: 15 }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
        // Use userId directly
        where.userId = userId;
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
  @ApiOperation({
    summary: 'Get ride by ID',
    description: 'Retrieve detailed information about a specific ride including driver, user, and chat messages'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Ride ID to retrieve',
    example: 1001
  })
  @ApiResponse({
    status: 200,
    description: 'Ride details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            rideId: { type: 'number', example: 1001 },
            originAddress: { type: 'string', example: '123 Main St' },
            destinationAddress: { type: 'string', example: '456 Oak Ave' },
            originLatitude: { type: 'number', example: 40.7128 },
            originLongitude: { type: 'number', example: -74.0060 },
            destinationLatitude: { type: 'number', example: 40.7589 },
            destinationLongitude: { type: 'number', example: -73.9851 },
            farePrice: { type: 'number', example: 25.50 },
            paymentStatus: { type: 'string', example: 'completed' },
            driverId: { type: 'number', example: 5 },
            userId: { type: 'string', example: 'user123' },
            createdAt: { type: 'string', format: 'date-time' },
            driver: {
              type: 'object',
              properties: {
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                carModel: { type: 'string', example: 'Toyota Camry' },
                licensePlate: { type: 'string', example: 'ABC123' },
                status: { type: 'string', example: 'online' }
              }
            },
            tier: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'UberX' },
                baseFare: { type: 'number', example: 2.50 },
                perMinuteRate: { type: 'number', example: 0.30 },
                perMileRate: { type: 'number', example: 1.20 }
              }
            },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  messageText: { type: 'string', example: 'On my way!' },
                  createdAt: { type: 'string', format: 'date-time' },
                  sender: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'John Doe' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Ride not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Get stores with filters',
    description: 'Retrieve a paginated list of stores with advanced filtering and search capabilities'
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of stores per page',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search term for store name or address',
    example: 'pizza'
  })
  @ApiQuery({
    name: 'category',
    type: 'string',
    required: false,
    description: 'Filter by store category',
    example: 'restaurant'
  })
  @ApiQuery({
    name: 'isOpen',
    type: 'boolean',
    required: false,
    description: 'Filter by store status',
    example: true
  })
  @ApiResponse({
    status: 200,
    description: 'Stores retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Mario\'s Pizza' },
              address: { type: 'string', example: '123 Main St' },
              category: { type: 'string', example: 'restaurant' },
              cuisineType: { type: 'string', example: 'Italian' },
              rating: { type: 'number', example: 4.5 },
              isOpen: { type: 'boolean', example: true },
              ownerId: { type: 'string', example: 'owner123' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 50 },
            pages: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
            ownerId: true,
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
  @ApiOperation({
    summary: 'Get store by ID',
    description: 'Retrieve detailed information about a specific store including products and statistics'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Store ID to retrieve',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Store details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Mario\'s Pizza' },
            address: { type: 'string', example: '123 Main St' },
            latitude: { type: 'number', example: 40.7128 },
            longitude: { type: 'number', example: -74.0060 },
            category: { type: 'string', example: 'restaurant' },
            cuisineType: { type: 'string', example: 'Italian' },
            logoUrl: { type: 'string', example: 'https://example.com/logo.jpg' },
            rating: { type: 'number', example: 4.5 },
            isOpen: { type: 'boolean', example: true },
            ownerId: { type: 'string', example: 'owner123' },
            createdAt: { type: 'string', format: 'date-time' },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Margherita Pizza' },
                  price: { type: 'number', example: 15.99 },
                  isAvailable: { type: 'boolean', example: true }
                }
              }
            },
            _count: {
              type: 'object',
              properties: {
                products: { type: 'number', example: 25 },
                deliveryOrders: { type: 'number', example: 150 },
                ratings: { type: 'number', example: 45 }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
          ownerId: true,
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
  @ApiOperation({
    summary: 'Update store status',
    description: 'Open or close a store for business operations'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Store ID to update',
    example: 1
  })
  @ApiBody({
    description: 'Store status update data',
    schema: {
      type: 'object',
      properties: {
        isOpen: { type: 'boolean', example: false, description: 'Whether the store should be open for business' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Store status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Store closed successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Mario\'s Pizza' },
            isOpen: { type: 'boolean', example: false },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid data or validation error' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({
    summary: 'Get system reports',
    description: 'Retrieve various system reports including users, rides, drivers, and financial data'
  })
  @ApiParam({
    name: 'type',
    type: 'string',
    description: 'Type of report to generate',
    example: 'users',
    enum: ['users', 'rides', 'drivers', 'financial']
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    required: false,
    description: 'Start date for report (ISO format)',
    example: '2024-01-01'
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    required: false,
    description: 'End date for report (ISO format)',
    example: '2024-12-31'
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        reportType: { type: 'string', example: 'users' },
        data: {
          type: 'object',
          oneOf: [
            {
              properties: {
                totalUsers: { type: 'number', example: 150 },
                totalAdmins: { type: 'number', example: 5 },
                userGrowth: {
                  type: 'object',
                  properties: {
                    weeklyGrowth: { type: 'number', example: 12 },
                    monthlyGrowth: { type: 'number', example: 45 },
                    growthRate: { type: 'number', example: 15.5 }
                  }
                }
              }
            },
            {
              properties: {
                totalRides: { type: 'number', example: 1250 },
                totalRevenue: { type: 'number', example: 15420.50 },
                averageFare: { type: 'number', example: 12.34 },
                rideTrends: {
                  type: 'object',
                  properties: {
                    weeklyRides: { type: 'number', example: 180 },
                    weeklyChange: { type: 'number', example: 25 },
                    monthlyRides: { type: 'number', example: 750 },
                    monthlyChange: { type: 'number', example: 120 }
                  }
                }
              }
            },
            {
              properties: {
                totalDrivers: { type: 'number', example: 45 },
                onlineDrivers: { type: 'number', example: 32 },
                verifiedDrivers: { type: 'number', example: 40 },
                driverPerformance: {
                  type: 'object',
                  properties: {
                    topDrivers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number', example: 1 },
                          firstName: { type: 'string', example: 'John' },
                          lastName: { type: 'string', example: 'Doe' },
                          _count: {
                            type: 'object',
                            properties: {
                              rides: { type: 'number', example: 25 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            {
              properties: {
                totalWalletBalance: { type: 'number', example: 50000.00 },
                transactionVolume: { type: 'number', example: 75000.00 },
                revenueByService: {
                  type: 'object',
                  properties: {
                    rides: { type: 'number', example: 45000.00 },
                    delivery: { type: 'number', example: 30000.00 },
                    total: { type: 'number', example: 75000.00 }
                  }
                }
              }
            }
          ]
        },
        generatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Report type not found' })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid report type' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
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
