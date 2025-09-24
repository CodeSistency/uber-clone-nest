import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { Permission } from '../../../entities/admin.entity';
import { UserManagementService } from '../services/user-management.service';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/users')
@ApiBearerAuth('JWT-auth')
export class UserManagementController {
  private readonly logger = new Logger(UserManagementController.name);

  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({
    summary: 'Get users with filters',
    description:
      'Retrieve a paginated list of users with advanced filtering and search capabilities',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of users per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search term for name or email',
    example: 'john',
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
    description: 'User status filter (active/inactive)',
    example: 'active',
  })
  @ApiQuery({
    name: 'userType',
    type: 'string',
    required: false,
    description: 'User type filter',
    example: 'user',
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
              createdAt: { type: 'string', format: 'date-time' },
              _count: {
                type: 'object',
                properties: {
                  rides: { type: 'number', example: 5 },
                  deliveryOrders: { type: 'number', example: 3 },
                  ratings: { type: 'number', example: 12 },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 150 },
            pages: { type: 'number', example: 15 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('userType') userType?: string,
  ) {
    this.logger.log(
      `Fetching users - page: ${page}, limit: ${limit}, search: ${search}, status: ${status}, userType: ${userType}`,
    );
    return this.userManagementService.getUsers({
      page,
      limit,
      search,
      status,
      userType,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        userType: { type: 'string', example: 'user' },
        isActive: { type: 'boolean', example: true },
        lastLogin: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        wallet: {
          type: 'object',
          properties: {
            balance: { type: 'number', example: 100.5 },
            currency: { type: 'string', example: 'USD' },
          },
        },
        _count: {
          type: 'object',
          properties: {
            rides: { type: 'number', example: 5 },
            deliveryOrders: { type: 'number', example: 3 },
            ratings: { type: 'number', example: 12 },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching user by ID: ${id}`);
    return this.userManagementService.getUserById(id);
  }

  @Put(':id/status')
  @RequirePermissions(Permission.USER_WRITE)
  @ApiOperation({
    summary: 'Update user status',
    description: 'Activate or deactivate a user account',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID to update',
    example: 1,
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
            isActive: { type: 'boolean', example: false },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    this.logger.log(
      `Updating status for user ID: ${id}, isActive: ${isActive}`,
    );
    return this.userManagementService.updateUserStatus(id, isActive);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USER_WRITE)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently delete a user account (soft delete)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Deleting user with ID: ${id}`);
    await this.userManagementService.deleteUser(id);
    return { success: true, message: 'User deleted successfully' };
  }
}
