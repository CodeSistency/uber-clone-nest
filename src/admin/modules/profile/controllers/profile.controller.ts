import { Controller, Get, Put, Body, UseGuards, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { AuthenticatedAdmin } from '../../../interfaces/admin.interface';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/profile')
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get admin profile',
    description: 'Retrieve the current authenticated admin profile information',
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
          example: ['user:read', 'user:write'],
        },
        lastLogin: { type: 'string', format: 'date-time' },
        lastAdminLogin: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getProfile(@CurrentUser() user: AuthenticatedAdmin) {
    this.logger.log(`Fetching profile for admin ${user.email}`);
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Update admin profile',
    description: 'Update the current authenticated admin profile information',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Profile update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'John Doe Updated' },
        email: { type: 'string', example: 'admin@uberclone.com' },
        adminRole: { type: 'string', example: 'admin' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateProfile(
    @CurrentUser() user: AuthenticatedAdmin,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    this.logger.log(`Updating profile for admin ${user.email}`);
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }
}
