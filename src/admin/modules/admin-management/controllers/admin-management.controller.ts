import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { Permission } from '../../../entities/admin.entity';
import { AdminManagementService } from '../services/admin-management.service';
import { CreateAdminDto } from '../dtos/create-admin.dto';
import { UpdateAdminDto } from '../dtos/update-admin.dto';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/management')
@ApiBearerAuth('JWT-auth')
export class AdminManagementController {
  private readonly logger = new Logger(AdminManagementController.name);

  constructor(
    private readonly adminManagementService: AdminManagementService,
  ) {}

  @Post()
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Create new admin',
    description:
      'Create a new administrator account with specified role and permissions',
  })
  @ApiBody({
    type: CreateAdminDto,
    description:
      'Admin creation data including name, email, password, role and permissions',
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
          example: ['user:read', 'user:write'],
        },
        isActive: { type: 'boolean', example: true },
        adminCreatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid data or validation error',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    this.logger.log(`Creating new admin: ${createAdminDto.email}`);
    return this.adminManagementService.createAdmin(createAdminDto);
  }

  @Get()
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Get all admins',
    description:
      'Retrieve a list of all administrator accounts with their roles and permissions',
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
            example: ['user:read', 'user:write'],
          },
          isActive: { type: 'boolean', example: true },
          lastAdminLogin: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getAllAdmins() {
    this.logger.log('Fetching all admins');
    return this.adminManagementService.getAllAdmins();
  }

  @Get(':id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Get admin by ID',
    description:
      'Retrieve detailed information about a specific administrator account',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Admin ID to retrieve',
    example: 1,
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
          example: ['user:read', 'user:write'],
        },
        isActive: { type: 'boolean', example: true },
        lastAdminLogin: { type: 'string', format: 'date-time' },
        adminCreatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getAdminById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching admin by ID: ${id}`);
    return this.adminManagementService.getAdminById(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Update admin',
    description:
      'Update an administrator account information, role, or permissions',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Admin ID to update',
    example: 1,
  })
  @ApiBody({
    type: UpdateAdminDto,
    description: 'Admin update data',
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
          example: ['user:read', 'user:write', 'user:delete'],
        },
        isActive: { type: 'boolean', example: true },
        adminUpdatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid data or validation error',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    this.logger.log(`Updating admin ID: ${id}`);
    return this.adminManagementService.updateAdmin(id, updateAdminDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({
    summary: 'Delete admin',
    description:
      'Convert an administrator account to a regular user account (soft delete)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Admin ID to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Admin converted to regular user successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Admin deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Deleting admin ID: ${id}`);
    await this.adminManagementService.deleteAdmin(id);
    return { message: 'Admin deleted successfully' };
  }
}
