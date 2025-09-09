import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { PermissionInterface, GroupInterface, UserPermissions, PermissionCheck } from './interfaces/permission.interface';

@Injectable()
export class GroupPermissionsService {
  private readonly logger = new Logger(GroupPermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =========================================
  // PERMISSION MANAGEMENT
  // =========================================

  async createPermission(createPermissionDto: CreatePermissionDto): Promise<PermissionInterface> {
    try {
      // Check if permission code already exists
      const existingPermission = await this.prisma.permission.findUnique({
        where: { code: createPermissionDto.code },
      });

      if (existingPermission) {
        throw new BadRequestException(`Permission with code '${createPermissionDto.code}' already exists`);
      }

      const permission = await this.prisma.permission.create({
        data: createPermissionDto,
      });

      this.logger.log(`Created permission: ${permission.code}`);
      return permission;
    } catch (error) {
      this.logger.error(`Failed to create permission: ${createPermissionDto.code}`, error);
      throw error;
    }
  }

  async findAllPermissions(): Promise<PermissionInterface[]> {
    return this.prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { code: 'asc' },
      ],
    });
  }

  async findPermissionById(id: number): Promise<PermissionInterface> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async findPermissionByCode(code: string): Promise<PermissionInterface> {
    const permission = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with code '${code}' not found`);
    }

    return permission;
  }

  async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto): Promise<PermissionInterface> {
    try {
      const permission = await this.findPermissionById(id);

      const updatedPermission = await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
      });

      this.logger.log(`Updated permission: ${permission.code} -> ${updatedPermission.code}`);
      return updatedPermission;
    } catch (error) {
      this.logger.error(`Failed to update permission with ID ${id}`, error);
      throw error;
    }
  }

  async deletePermission(id: number): Promise<void> {
    try {
      const permission = await this.findPermissionById(id);

      // Check if permission is being used by any groups
      const groupPermissions = await this.prisma.groupPermission.findMany({
        where: { permissionId: id },
      });

      if (groupPermissions.length > 0) {
        throw new BadRequestException(`Cannot delete permission '${permission.code}' as it is assigned to ${groupPermissions.length} group(s)`);
      }

      await this.prisma.permission.delete({
        where: { id },
      });

      this.logger.log(`Deleted permission: ${permission.code}`);
    } catch (error) {
      this.logger.error(`Failed to delete permission with ID ${id}`, error);
      throw error;
    }
  }

  // =========================================
  // GROUP MANAGEMENT
  // =========================================

  async createGroup(createGroupDto: CreateGroupDto): Promise<GroupInterface> {
    try {
      // Check if group name already exists
      const existingGroup = await this.prisma.group.findUnique({
        where: { name: createGroupDto.name },
      });

      if (existingGroup) {
        throw new BadRequestException(`Group with name '${createGroupDto.name}' already exists`);
      }

      const group = await this.prisma.group.create({
        data: createGroupDto,
      });

      this.logger.log(`Created group: ${group.name}`);
      return group;
    } catch (error) {
      this.logger.error(`Failed to create group: ${createGroupDto.name}`, error);
      throw error;
    }
  }

  async findAllGroups(): Promise<GroupInterface[]> {
    return this.prisma.group.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  async findGroupById(id: number): Promise<GroupInterface> {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async findGroupByName(name: string): Promise<GroupInterface> {
    const group = await this.prisma.group.findUnique({
      where: { name },
    });

    if (!group) {
      throw new NotFoundException(`Group with name '${name}' not found`);
    }

    return group;
  }

  async updateGroup(id: number, updateGroupDto: UpdateGroupDto): Promise<GroupInterface> {
    try {
      const group = await this.findGroupById(id);

      // Prevent updating system groups' critical properties
      if (group.isSystem && updateGroupDto.name !== undefined && updateGroupDto.name !== group.name) {
        throw new BadRequestException('Cannot change name of system groups');
      }

      const updatedGroup = await this.prisma.group.update({
        where: { id },
        data: updateGroupDto,
      });

      this.logger.log(`Updated group: ${group.name} -> ${updatedGroup.name}`);
      return updatedGroup;
    } catch (error) {
      this.logger.error(`Failed to update group with ID ${id}`, error);
      throw error;
    }
  }

  async deleteGroup(id: number): Promise<void> {
    try {
      const group = await this.findGroupById(id);

      // Prevent deletion of system groups
      if (group.isSystem) {
        throw new BadRequestException(`Cannot delete system group '${group.name}'`);
      }

      // Check if group has users assigned
      const userGroups = await this.prisma.userGroup.findMany({
        where: { groupId: id },
      });

      if (userGroups.length > 0) {
        throw new BadRequestException(`Cannot delete group '${group.name}' as it has ${userGroups.length} user(s) assigned`);
      }

      await this.prisma.group.delete({
        where: { id },
      });

      this.logger.log(`Deleted group: ${group.name}`);
    } catch (error) {
      this.logger.error(`Failed to delete group with ID ${id}`, error);
      throw error;
    }
  }

  // =========================================
  // GROUP-PERMISSION RELATIONSHIPS
  // =========================================

  async assignPermissionsToGroup(groupId: number, assignPermissionsDto: AssignPermissionsDto): Promise<void> {
    try {
      const group = await this.findGroupById(groupId);

      // Get existing permissions for this group
      const existingPermissions = await this.prisma.groupPermission.findMany({
        where: { groupId },
        include: { permission: true },
      });

      const existingPermissionCodes = existingPermissions.map(gp => gp.permission.code);
      const newPermissionCodes = assignPermissionsDto.permissionCodes;

      // Find permissions to add and remove
      const permissionsToAdd = newPermissionCodes.filter(code => !existingPermissionCodes.includes(code));
      const permissionsToRemove = existingPermissionCodes.filter(code => !newPermissionCodes.includes(code));

      // Remove old permissions
      if (permissionsToRemove.length > 0) {
        const permissionIdsToRemove = existingPermissions
          .filter(gp => permissionsToRemove.includes(gp.permission.code))
          .map(gp => gp.id);

        await this.prisma.groupPermission.deleteMany({
          where: { id: { in: permissionIdsToRemove } },
        });
      }

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        const permissions = await this.prisma.permission.findMany({
          where: { code: { in: permissionsToAdd } },
        });

        const groupPermissions = permissions.map(permission => ({
          groupId,
          permissionId: permission.id,
          grantedAt: new Date(),
        }));

        await this.prisma.groupPermission.createMany({
          data: groupPermissions,
        });
      }

      this.logger.log(`Updated permissions for group '${group.name}': +${permissionsToAdd.length} -${permissionsToRemove.length}`);
    } catch (error) {
      this.logger.error(`Failed to assign permissions to group ${groupId}`, error);
      throw error;
    }
  }

  async getGroupPermissions(groupId: number): Promise<PermissionInterface[]> {
    const group = await this.findGroupById(groupId);

    const groupPermissions = await this.prisma.groupPermission.findMany({
      where: { groupId },
      include: { permission: true },
      orderBy: [
        { permission: { module: 'asc' } },
        { permission: { code: 'asc' } },
      ],
    });

    return groupPermissions.map(gp => gp.permission);
  }

  async removePermissionFromGroup(groupId: number, permissionId: number): Promise<void> {
    try {
      const group = await this.findGroupById(groupId);
      const permission = await this.findPermissionById(permissionId);

      const groupPermission = await this.prisma.groupPermission.findUnique({
        where: {
          groupId_permissionId: {
            groupId,
            permissionId,
          },
        },
      });

      if (!groupPermission) {
        throw new NotFoundException(`Permission '${permission.code}' is not assigned to group '${group.name}'`);
      }

      await this.prisma.groupPermission.delete({
        where: {
          groupId_permissionId: {
            groupId,
            permissionId,
          },
        },
      });

      this.logger.log(`Removed permission '${permission.code}' from group '${group.name}'`);
    } catch (error) {
      this.logger.error(`Failed to remove permission ${permissionId} from group ${groupId}`, error);
      throw error;
    }
  }

  // =========================================
  // USER-GROUP RELATIONSHIPS
  // =========================================

  async assignUsersToGroup(groupId: number, assignUsersDto: AssignUsersDto): Promise<void> {
    try {
      const group = await this.findGroupById(groupId);

      // Validate users exist
      const users = await this.prisma.user.findMany({
        where: { id: { in: assignUsersDto.userIds } },
      });

      if (users.length !== assignUsersDto.userIds.length) {
        const foundIds = users.map(u => u.id);
        const missingIds = assignUsersDto.userIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Users with IDs ${missingIds.join(', ')} not found`);
      }

      // Get existing user-group assignments
      const existingAssignments = await this.prisma.userGroup.findMany({
        where: {
          groupId,
          userId: { in: assignUsersDto.userIds },
        },
      });

      const existingUserIds = existingAssignments.map(ug => ug.userId);
      const newUserIds = assignUsersDto.userIds.filter(id => !existingUserIds.includes(id));

      // Create new assignments
      if (newUserIds.length > 0) {
        const userGroups = newUserIds.map(userId => ({
          userId,
          groupId,
          assignedAt: new Date(),
          isActive: true,
        }));

        await this.prisma.userGroup.createMany({
          data: userGroups,
        });
      }

      this.logger.log(`Assigned ${newUserIds.length} user(s) to group '${group.name}'`);
    } catch (error) {
      this.logger.error(`Failed to assign users to group ${groupId}`, error);
      throw error;
    }
  }

  async getUserGroups(userId: number): Promise<GroupInterface[]> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userGroups = await this.prisma.userGroup.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { group: true },
      orderBy: { group: { priority: 'desc' } },
    });

    return userGroups.map(ug => ug.group);
  }

  async getGroupUsers(groupId: number): Promise<any[]> {
    const group = await this.findGroupById(groupId);

    const userGroups = await this.prisma.userGroup.findMany({
      where: {
        groupId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { user: true },
      orderBy: { assignedAt: 'desc' },
    });

    return userGroups.map(ug => ({
      user: ug.user,
      assignedAt: ug.assignedAt,
      assignedBy: ug.assignedBy,
      expiresAt: ug.expiresAt,
    }));
  }

  async removeUserFromGroup(userId: number, groupId: number): Promise<void> {
    try {
      const group = await this.findGroupById(groupId);

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const userGroup = await this.prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      if (!userGroup) {
        throw new NotFoundException(`User ${userId} is not assigned to group '${group.name}'`);
      }

      await this.prisma.userGroup.delete({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });

      this.logger.log(`Removed user ${userId} from group '${group.name}'`);
    } catch (error) {
      this.logger.error(`Failed to remove user ${userId} from group ${groupId}`, error);
      throw error;
    }
  }

  // =========================================
  // PERMISSION CHECKING
  // =========================================

  async checkUserPermission(userId: number, permissionCode: string): Promise<PermissionCheck> {
    try {
      // Get user groups with permissions
      const userGroups = await this.prisma.userGroup.findMany({
        where: {
          userId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          group: {
            include: {
              permissions: {
                include: { permission: true },
                where: { permission: { isActive: true } },
              },
            },
          },
        },
        orderBy: { group: { priority: 'desc' } },
      });

      let hasPermission = false;
      const groupsWithPermission: string[] = [];

      // Check each group for the permission
      for (const userGroup of userGroups) {
        const groupHasPermission = userGroup.group.permissions.some(
          gp => gp.permission.code === permissionCode
        );

        if (groupHasPermission) {
          hasPermission = true;
          groupsWithPermission.push(userGroup.group.name);
        }
      }

      return {
        userId,
        permission: permissionCode,
        hasPermission,
        groupsWithPermission,
      };
    } catch (error) {
      this.logger.error(`Failed to check permission for user ${userId}: ${permissionCode}`, error);
      return {
        userId,
        permission: permissionCode,
        hasPermission: false,
        groupsWithPermission: [],
      };
    }
  }

  async getUserPermissions(userId: number): Promise<UserPermissions> {
    try {
      // Get user groups with permissions
      const userGroups = await this.prisma.userGroup.findMany({
        where: {
          userId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          group: {
            include: {
              permissions: {
                include: { permission: true },
                where: { permission: { isActive: true } },
              },
            },
          },
        },
        orderBy: { group: { priority: 'desc' } },
      });

      const permissions = new Set<string>();
      const groups = userGroups.map(ug => ({
        id: ug.group.id,
        name: ug.group.name,
        priority: ug.group.priority,
      }));

      // Collect all unique permissions
      for (const userGroup of userGroups) {
        for (const groupPermission of userGroup.group.permissions) {
          permissions.add(groupPermission.permission.code);
        }
      }

      return {
        userId,
        permissions: Array.from(permissions),
        groups,
      };
    } catch (error) {
      this.logger.error(`Failed to get permissions for user ${userId}`, error);
      return {
        userId,
        permissions: [],
        groups: [],
      };
    }
  }

  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const permissionCheck = await this.checkUserPermission(userId, permissionCode);
    return permissionCheck.hasPermission;
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  async seedDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // Users
      { code: 'users:read', name: 'Ver Usuarios', module: 'users' },
      { code: 'users:read:own', name: 'Ver Perfil Propio', module: 'users' },
      { code: 'users:create', name: 'Crear Usuarios', module: 'users' },
      { code: 'users:update', name: 'Actualizar Usuarios', module: 'users' },
      { code: 'users:update:own', name: 'Actualizar Perfil Propio', module: 'users' },
      { code: 'users:delete', name: 'Eliminar Usuarios', module: 'users' },
      { code: 'users:manage_groups', name: 'Gestionar Grupos de Usuarios', module: 'users' },

      // Rides
      { code: 'rides:read', name: 'Ver Viajes', module: 'rides' },
      { code: 'rides:create', name: 'Crear Viajes', module: 'rides' },
      { code: 'rides:update', name: 'Actualizar Viajes', module: 'rides' },
      { code: 'rides:cancel', name: 'Cancelar Viajes', module: 'rides' },
      { code: 'rides:manage_all', name: 'Gestionar Todos los Viajes', module: 'rides' },

      // Drivers
      { code: 'drivers:read', name: 'Ver Conductores', module: 'drivers' },
      { code: 'drivers:create', name: 'Crear Conductores', module: 'drivers' },
      { code: 'drivers:update', name: 'Actualizar Conductores', module: 'drivers' },
      { code: 'drivers:verify', name: 'Verificar Conductores', module: 'drivers' },

      // Deliveries
      { code: 'deliveries:read', name: 'Ver Entregas', module: 'deliveries' },
      { code: 'deliveries:create', name: 'Crear Entregas', module: 'deliveries' },
      { code: 'deliveries:update', name: 'Actualizar Entregas', module: 'deliveries' },

      // Stores
      { code: 'stores:read', name: 'Ver Comercios', module: 'stores' },
      { code: 'stores:create', name: 'Crear Comercios', module: 'stores' },
      { code: 'stores:update', name: 'Actualizar Comercios', module: 'stores' },

      // Finance
      { code: 'finance:read', name: 'Ver Datos Financieros', module: 'finance' },
      { code: 'finance:manage_wallet', name: 'Gestionar Wallets', module: 'finance' },

      // Analytics
      { code: 'analytics:read', name: 'Ver Analytics', module: 'analytics' },
      { code: 'analytics:export', name: 'Exportar Reportes', module: 'analytics' },

      // Notifications
      { code: 'notifications:read', name: 'Ver Notificaciones', module: 'notifications' },
      { code: 'notifications:send', name: 'Enviar Notificaciones', module: 'notifications' },

      // System
      { code: 'system:read_logs', name: 'Ver Logs del Sistema', module: 'system' },
      { code: 'system:manage_config', name: 'Gestionar Configuración', module: 'system' },
      { code: 'permissions:read', name: 'Ver Permisos', module: 'system' },
      { code: 'permissions:manage', name: 'Gestionar Permisos', module: 'system' },
      { code: 'groups:read', name: 'Ver Grupos', module: 'system' },
      { code: 'groups:create', name: 'Crear Grupos', module: 'system' },
      { code: 'groups:update', name: 'Actualizar Grupos', module: 'system' },
      { code: 'groups:delete', name: 'Eliminar Grupos', module: 'system' },

      // Moderation
      { code: 'moderation:read_reports', name: 'Ver Reportes', module: 'moderation' },
      { code: 'moderation:manage_ratings', name: 'Gestionar Calificaciones', module: 'moderation' },
    ];

    for (const permission of defaultPermissions) {
      await this.prisma.permission.upsert({
        where: { code: permission.code },
        update: {},
        create: permission,
      });
    }

    this.logger.log(`Seeded ${defaultPermissions.length} default permissions`);
  }

  async seedDefaultGroups(): Promise<void> {
    const defaultGroups = [
      {
        name: 'Super Admin',
        description: 'Control total del sistema',
        color: '#FF0000',
        isSystem: true,
        priority: 100,
      },
      {
        name: 'Admin General',
        description: 'Administración general del sistema',
        color: '#DC143C',
        isSystem: true,
        priority: 90,
      },
      {
        name: 'Gerente de Operaciones',
        description: 'Gestión de operaciones diarias',
        color: '#4169E1',
        isSystem: true,
        priority: 80,
      },
      {
        name: 'Gerente Financiero',
        description: 'Gestión financiera y pagos',
        color: '#228B22',
        isSystem: true,
        priority: 75,
      },
      {
        name: 'Moderador de Contenido',
        description: 'Moderación de contenido y usuarios',
        color: '#FF8C00',
        isSystem: true,
        priority: 70,
      },
      {
        name: 'Soporte al Cliente',
        description: 'Atención a usuarios y conductores',
        color: '#9370DB',
        isSystem: true,
        priority: 60,
      },
      {
        name: 'Analista de Datos',
        description: 'Acceso a reportes y analytics',
        color: '#20B2AA',
        isSystem: true,
        priority: 50,
      },
      {
        name: 'Usuario Estándar',
        description: 'Usuario regular sin permisos administrativos',
        color: '#808080',
        isSystem: true,
        priority: 0,
      },
    ];

    for (const group of defaultGroups) {
      await this.prisma.group.upsert({
        where: { name: group.name },
        update: {},
        create: group,
      });
    }

    this.logger.log(`Seeded ${defaultGroups.length} default groups`);

    // Assign all permissions to Super Admin
    const superAdminGroup = await this.findGroupByName('Super Admin');
    const allPermissions = await this.findAllPermissions();

    await this.assignPermissionsToGroup(
      superAdminGroup.id,
      { permissionCodes: allPermissions.map(p => p.code) }
    );

    this.logger.log('Assigned all permissions to Super Admin group');
  }
}
