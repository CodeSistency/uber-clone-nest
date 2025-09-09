import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GroupPermissionsService } from './group-permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignUsersDto } from './dto/assign-users.dto';

@ApiTags('group-permissions')
@Controller('api/group-permissions')
export class GroupPermissionsController {
  constructor(private readonly groupPermissionsService: GroupPermissionsService) {}

  // =========================================
  // PERMISSION MANAGEMENT ENDPOINTS
  // =========================================

  @Post('permissions')
  @ApiOperation({
    summary: 'Create a new permission',
    description: 'Creates a new permission with specified code, name, and module'
  })
  @ApiBody({
    type: CreatePermissionDto,
    description: 'Permission creation data'
  })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        code: { type: 'string', example: 'users:read' },
        name: { type: 'string', example: 'Read Users' },
        description: { type: 'string', example: 'Allows reading user information' },
        module: { type: 'string', example: 'users' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate code'
  })
  @ApiResponse({
    status: 409,
    description: 'Permission with this code already exists'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.groupPermissionsService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'Get all permissions',
    description: 'Retrieves a list of all permissions in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'List of permissions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          code: { type: 'string', example: 'users:read' },
          name: { type: 'string', example: 'Read Users' },
          module: { type: 'string', example: 'users' },
          isActive: { type: 'boolean', example: true }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async findAllPermissions() {
    return this.groupPermissionsService.findAllPermissions();
  }

  @Get('permissions/:id')
  @ApiOperation({
    summary: 'Get permission by ID',
    description: 'Retrieves a specific permission by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Permission ID',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Permission found and returned successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async findPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.groupPermissionsService.findPermissionById(id);
  }

  @Get('permissions/code/:code')
  @ApiOperation({
    summary: 'Get permission by code',
    description: 'Retrieves a specific permission by its unique code'
  })
  @ApiParam({
    name: 'code',
    description: 'Permission code (e.g., users:read)',
    type: 'string',
    example: 'users:read'
  })
  @ApiResponse({
    status: 200,
    description: 'Permission found and returned successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found'
  })
  async findPermissionByCode(@Param('code') code: string) {
    return this.groupPermissionsService.findPermissionByCode(code);
  }

  @Put('permissions/:id')
  @ApiOperation({
    summary: 'Update permission',
    description: 'Updates an existing permission with new data'
  })
  @ApiParam({
    name: 'id',
    description: 'Permission ID to update',
    type: 'number',
    example: 1
  })
  @ApiBody({
    type: UpdatePermissionDto,
    description: 'Permission update data'
  })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.groupPermissionsService.updatePermission(id, updatePermissionDto);
  }

  @Delete('permissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete permission',
    description: 'Deletes a permission from the system'
  })
  @ApiParam({
    name: 'id',
    description: 'Permission ID to delete',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 204,
    description: 'Permission deleted successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete permission (in use by groups)'
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    await this.groupPermissionsService.deletePermission(id);
  }

  // =========================================
  // GROUP MANAGEMENT ENDPOINTS
  // =========================================

  @Post('groups')
  @ApiOperation({
    summary: 'Create a new group',
    description: 'Creates a new user group with specified name and settings'
  })
  @ApiBody({
    type: CreateGroupDto,
    description: 'Group creation data'
  })
  @ApiResponse({
    status: 201,
    description: 'Group created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Moderators' },
        description: { type: 'string', example: 'Content moderation team' },
        color: { type: 'string', example: '#FF8C00' },
        isSystem: { type: 'boolean', example: false },
        isActive: { type: 'boolean', example: true },
        priority: { type: 'number', example: 70 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate name'
  })
  @ApiResponse({
    status: 409,
    description: 'Group with this name already exists'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.groupPermissionsService.createGroup(createGroupDto);
  }

  @Get('groups')
  @ApiOperation({
    summary: 'Get all groups',
    description: 'Retrieves a list of all user groups in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'List of groups retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Moderators' },
          description: { type: 'string', example: 'Content moderation team' },
          color: { type: 'string', example: '#FF8C00' },
          isSystem: { type: 'boolean', example: false },
          isActive: { type: 'boolean', example: true },
          priority: { type: 'number', example: 70 }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async findAllGroups() {
    return this.groupPermissionsService.findAllGroups();
  }

  @Get('groups/:id')
  @ApiOperation({
    summary: 'Get group by ID',
    description: 'Retrieves a specific group by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Group found and returned successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async findGroupById(@Param('id', ParseIntPipe) id: number) {
    return this.groupPermissionsService.findGroupById(id);
  }

  @Get('groups/name/:name')
  @ApiOperation({
    summary: 'Get group by name',
    description: 'Retrieves a specific group by its unique name'
  })
  @ApiParam({
    name: 'name',
    description: 'Group name',
    type: 'string',
    example: 'Moderators'
  })
  @ApiResponse({
    status: 200,
    description: 'Group found and returned successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found'
  })
  async findGroupByName(@Param('name') name: string) {
    return this.groupPermissionsService.findGroupByName(name);
  }

  @Put('groups/:id')
  @ApiOperation({
    summary: 'Update group',
    description: 'Updates an existing group with new data'
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID to update',
    type: 'number',
    example: 1
  })
  @ApiBody({
    type: UpdateGroupDto,
    description: 'Group update data'
  })
  @ApiResponse({
    status: 200,
    description: 'Group updated successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update system group properties'
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async updateGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupPermissionsService.updateGroup(id, updateGroupDto);
  }

  @Delete('groups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete group',
    description: 'Deletes a group from the system'
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID to delete',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 204,
    description: 'Group deleted successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete system group or group with users'
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async deleteGroup(@Param('id', ParseIntPipe) id: number) {
    await this.groupPermissionsService.deleteGroup(id);
  }

  // =========================================
  // GROUP-PERMISSION RELATIONSHIP ENDPOINTS
  // =========================================

  @Post('groups/:groupId/permissions')
  @ApiOperation({
    summary: 'Assign permissions to group',
    description: 'Assigns multiple permissions to a specific group'
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID to assign permissions to',
    type: 'number',
    example: 1
  })
  @ApiBody({
    type: AssignPermissionsDto,
    description: 'List of permission codes to assign'
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Permissions assigned successfully' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async assignPermissionsToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    await this.groupPermissionsService.assignPermissionsToGroup(groupId, assignPermissionsDto);
    return { message: 'Permissions assigned successfully' };
  }

  @Get('groups/:groupId/permissions')
  @ApiOperation({
    summary: 'Get group permissions',
    description: 'Retrieves all permissions assigned to a specific group'
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID to get permissions for',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Group permissions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          code: { type: 'string', example: 'users:read' },
          name: { type: 'string', example: 'Read Users' },
          module: { type: 'string', example: 'users' }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async getGroupPermissions(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.groupPermissionsService.getGroupPermissions(groupId);
  }

  @Delete('groups/:groupId/permissions/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove permission from group',
    description: 'Removes a specific permission from a group'
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    type: 'number',
    example: 1
  })
  @ApiParam({
    name: 'permissionId',
    description: 'Permission ID to remove',
    type: 'number',
    example: 5
  })
  @ApiResponse({
    status: 204,
    description: 'Permission removed from group successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Group or permission not found, or permission not assigned to group'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async removePermissionFromGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    await this.groupPermissionsService.removePermissionFromGroup(groupId, permissionId);
  }

  // =========================================
  // USER-GROUP RELATIONSHIP ENDPOINTS
  // =========================================

  @Post('groups/:groupId/users')
  @ApiOperation({
    summary: 'Assign users to group',
    description: 'Assigns multiple users to a specific group'
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID to assign users to',
    type: 'number',
    example: 1
  })
  @ApiBody({
    type: AssignUsersDto,
    description: 'List of user IDs to assign'
  })
  @ApiResponse({
    status: 200,
    description: 'Users assigned to group successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Users assigned to group successfully' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Group or users not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async assignUsersToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    await this.groupPermissionsService.assignUsersToGroup(groupId, assignUsersDto);
    return { message: 'Users assigned to group successfully' };
  }

  @Get('users/:userId/groups')
  @ApiOperation({
    summary: 'Get user groups',
    description: 'Retrieves all groups that a specific user belongs to'
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to get groups for',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'User groups retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Moderators' },
          description: { type: 'string', example: 'Content moderation team' },
          priority: { type: 'number', example: 70 }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async getUserGroups(@Param('userId', ParseIntPipe) userId: number) {
    return this.groupPermissionsService.getUserGroups(userId);
  }

  @Get('groups/:groupId/users')
  @ApiOperation({
    summary: 'Get group users',
    description: 'Retrieves all users that belong to a specific group'
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID to get users for',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Group users retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john@example.com' }
            }
          },
          assignedAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async getGroupUsers(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.groupPermissionsService.getGroupUsers(groupId);
  }

  @Delete('groups/:groupId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove user from group',
    description: 'Removes a specific user from a group'
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    type: 'number',
    example: 1
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to remove',
    type: 'number',
    example: 5
  })
  @ApiResponse({
    status: 204,
    description: 'User removed from group successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Group or user not found, or user not in group'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async removeUserFromGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.groupPermissionsService.removeUserFromGroup(userId, groupId);
  }

  // =========================================
  // PERMISSION CHECKING ENDPOINTS
  // =========================================

  @Get('users/:userId/permissions')
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Retrieves all permissions that a user has through their groups'
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to get permissions for',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'User permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        permissions: {
          type: 'array',
          items: { type: 'string', example: 'users:read' }
        },
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Moderators' },
              priority: { type: 'number', example: 70 }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.groupPermissionsService.getUserPermissions(userId);
  }

  @Get('users/:userId/check-permission')
  @ApiOperation({
    summary: 'Check user permission',
    description: 'Checks if a user has a specific permission'
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to check permission for',
    type: 'number',
    example: 1
  })
  @ApiQuery({
    name: 'permission',
    description: 'Permission code to check (e.g., users:read)',
    type: 'string',
    example: 'users:read'
  })
  @ApiResponse({
    status: 200,
    description: 'Permission check completed',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        permission: { type: 'string', example: 'users:read' },
        hasPermission: { type: 'boolean', example: true },
        groupsWithPermission: {
          type: 'array',
          items: { type: 'string', example: 'Moderators' }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Permission code is required'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async checkUserPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('permission') permissionCode: string,
  ) {
    if (!permissionCode) {
      throw new BadRequestException('Permission code is required');
    }
    return this.groupPermissionsService.checkUserPermission(userId, permissionCode);
  }

  // =========================================
  // UTILITY ENDPOINTS
  // =========================================

  @Post('seed/permissions')
  @ApiOperation({
    summary: 'Seed default permissions',
    description: 'Creates all default permissions in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'Default permissions seeded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Default permissions seeded successfully' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async seedDefaultPermissions() {
    await this.groupPermissionsService.seedDefaultPermissions();
    return { message: 'Default permissions seeded successfully' };
  }

  @Post('seed/groups')
  @ApiOperation({
    summary: 'Seed default groups',
    description: 'Creates all default user groups in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'Default groups seeded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Default groups seeded successfully' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async seedDefaultGroups() {
    await this.groupPermissionsService.seedDefaultGroups();
    return { message: 'Default groups seeded successfully' };
  }

  @Post('seed/all')
  @ApiOperation({
    summary: 'Seed all default data',
    description: 'Creates both default permissions and groups in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'All default data seeded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'All default data seeded successfully' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database error'
  })
  async seedAll() {
    await this.groupPermissionsService.seedDefaultPermissions();
    await this.groupPermissionsService.seedDefaultGroups();
    return { message: 'All default data seeded successfully' };
  }

}
