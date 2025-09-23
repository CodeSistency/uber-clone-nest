import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface GetUsersOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  userType?: string;
}

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene una lista paginada de usuarios con filtros avanzados
   * @param options Opciones de paginación y filtrado
   * @returns Lista de usuarios y metadatos de paginación
   */
  async getUsers(options: GetUsersOptions) {
    const { page, limit, search, status, userType } = options;
    const skip = (page - 1) * limit;

    // Construir el objeto where para los filtros
    const where: any = {
      userType: { not: 'admin' }, // Excluir administradores
    };

    // Aplicar filtro de búsqueda
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Aplicar filtro de estado
    if (status === 'active' || status === 'inactive') {
      where.isActive = status === 'active';
    }

    // Aplicar filtro de tipo de usuario
    if (userType) {
      where.userType = userType;
    }

    try {
      const [users, total] = await Promise.all([
        // Obtener usuarios con paginación y conteos relacionados
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            isActive: true,
            lastLogin: true,
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
        // Contar el total de usuarios que coinciden con los filtros
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
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID con información detallada
   * @param id ID del usuario
   * @returns Información detallada del usuario
   */
  async getUserById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { 
          id,
          userType: { not: 'admin' }, // Asegurar que no sea un administrador
        },
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          wallet: {
            select: {
              balance: true,
              // Note: The Wallet model doesn't have a currency field in the Prisma schema
              // Currency is stored at the User level
            },
          },
          currency: true, // Add currency from the User model
          _count: {
            select: {
              rides: true,
              deliveryOrders: true,
              ratings: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un usuario (activo/inactivo)
   * @param id ID del usuario
   * @param isActive Nuevo estado del usuario
   * @returns Usuario actualizado
   */
  async updateUserStatus(id: number, isActive: boolean) {
    // Verificar que el usuario existe y no es administrador
    const user = await this.prisma.user.findUnique({
      where: { 
        id,
        userType: { not: 'admin' },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // No permitir desactivar a un administrador
    if (user.userType === 'admin') {
      throw new BadRequestException('Cannot update status for admin users');
    }

    // Actualizar el estado del usuario
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Updated status for user ${id} to ${isActive ? 'active' : 'inactive'}`);
    
    return {
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser,
    };
  }

  /**
   * Elimina un usuario (soft delete)
   * @param id ID del usuario a eliminar
   */
  async deleteUser(id: number) {
    // Verificar que el usuario existe y no es administrador
    const user = await this.prisma.user.findUnique({
      where: { 
        id,
        userType: { not: 'admin' },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // No permitir eliminar administradores
    if (user.userType === 'admin') {
      throw new BadRequestException('Cannot delete admin users');
    }

    // Verificar si el usuario tiene viajes o pedidos activos
    const activeRides = await this.prisma.ride.count({
      where: {
        userId: id,
        paymentStatus: {
          // Using paymentStatus instead of status as per the Prisma schema
          in: ['pending', 'paid'],
        },
      },
    });

    const activeOrders = await this.prisma.deliveryOrder.count({
      where: {
        userId: id,
        status: {
          in: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'],
        },
      },
    });

    if (activeRides > 0 || activeOrders > 0) {
      throw new ConflictException(
        'Cannot delete user with active rides or delivery orders',
      );
    }

    // Realizar soft delete (marcar como inactivo)
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Cambiar el email para permitir reutilización
        phone: user.phone ? `deleted_${Date.now()}_${user.phone}` : null,
        // The User model doesn't have a deletedAt field in the Prisma schema
        // We're already marking as inactive and changing the email/phone
      },
    });

    this.logger.log(`Soft deleted user with ID: ${id}`);
  }
}
