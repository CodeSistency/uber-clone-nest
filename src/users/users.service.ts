import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { SearchUsersDto } from './dto/search-users.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    // Ensure required fields have defaults
    const userData = {
      ...data,
      preferredLanguage: data.preferredLanguage || 'es',
      timezone: data.timezone || 'America/Caracas',
      currency: data.currency || 'USD',
    };

    return this.prisma.user.create({
      data: userData,
    });
  }

  async findUserById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      userType: user.userType || 'user',
      adminRole: user.adminRole || null,
      adminPermissions: user.adminPermissions || [],
      lastAdminLogin: user.lastAdminLogin || null,
      adminCreatedAt: user.adminCreatedAt || null,
      adminUpdatedAt: user.adminUpdatedAt || null,
    };
  }

  async findUserByIdWithRelations(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });
  }

  async findUserByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        userType: true,
        adminRole: true,
        adminPermissions: true,
        lastAdminLogin: true,
        adminCreatedAt: true,
        adminUpdatedAt: true,
        wallet: true,
        emergencyContacts: true,
        rides: true,
        deliveryOrders: true,
        ratings: true,
        sentMessages: true,
        receivedRatings: true,
        notificationPreferences: true,
        pushTokens: true,
        notifications: true,
        adminAuditLogs: true,
      },
    });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserRides(userId: number): Promise<any[]> {
    const rides = await this.prisma.ride.findMany({
      where: { userId },
      include: {
        driver: true,
        tier: true,
        ratings: true,
        messages: true,
      },
    });
    return rides;
  }

  async getUserDeliveryOrders(userId: number): Promise<any[]> {
    const orders = await this.prisma.deliveryOrder.findMany({
      where: { userId },
      include: {
        store: true,
        courier: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        ratings: true,
        messages: true,
      },
    });
    return orders;
  }

  /**
   * Obtener usuario actual basado en ID del token JWT
   */
  async getCurrentUser(userId: number): Promise<User | null> {
    return this.findUserByIdWithRelations(userId);
  }

  /**
   * Actualizar usuario actual basado en ID del token JWT
   */
  async updateCurrentUser(
    userId: number,
    data: any
  ): Promise<User> {
    // Convertir campos de fecha si existen
    const updateData = { ...data };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Verificar si un usuario existe por ID
   */
  async userExistsById(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return !!user;
  }

  /**
   * Buscar usuarios con filtros dinámicos y paginación
   */
  async searchUsers(searchDto: SearchUsersDto): Promise<PaginatedUsersResponseDto> {
    const {
      page = 1,
      limit = 10,
      name,
      email,
      phone,
      city,
      state,
      country,
      userType,
      adminRole,
      isActive,
      emailVerified,
      phoneVerified,
      identityVerified,
      gender,
      preferredLanguage,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdFrom,
      createdTo,
      lastLoginFrom,
      lastLoginTo,
    } = searchDto;

    // Construir filtros dinámicamente
    const where: Prisma.UserWhereInput = {};

    // Filtros de texto (búsqueda parcial case-insensitive)
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (phone) {
      where.phone = {
        contains: phone,
      };
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (state) {
      where.state = {
        contains: state,
        mode: 'insensitive',
      };
    }

    if (country) {
      where.country = {
        contains: country,
        mode: 'insensitive',
      };
    }

    // Filtros exactos
    if (userType !== undefined) {
      where.userType = userType;
    }

    if (adminRole !== undefined) {
      where.adminRole = adminRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified;
    }

    if (phoneVerified !== undefined) {
      where.phoneVerified = phoneVerified;
    }

    if (identityVerified !== undefined) {
      where.identityVerified = identityVerified;
    }

    if (gender !== undefined) {
      where.gender = gender;
    }

    if (preferredLanguage) {
      where.preferredLanguage = preferredLanguage;
    }

    // Filtros de fecha
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    if (lastLoginFrom || lastLoginTo) {
      where.lastLogin = {};
      if (lastLoginFrom) {
        where.lastLogin.gte = new Date(lastLoginFrom);
      }
      if (lastLoginTo) {
        where.lastLogin.lte = new Date(lastLoginTo);
      }
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Ejecutar consulta de conteo y búsqueda en paralelo
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
        include: {
          wallet: {
            select: {
              balance: true,
            },
          },
          emergencyContacts: true,
          _count: {
            select: {
              rides: true,
              deliveryOrders: true,
              ratings: true,
            },
          },
        },
      }),
    ]);

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Construir lista de filtros aplicados
    const appliedFilters: string[] = [];
    const filters: any = {};

    if (name) {
      appliedFilters.push('name');
      filters.searchTerm = name;
    }
    if (email) appliedFilters.push('email');
    if (phone) appliedFilters.push('phone');
    if (city) appliedFilters.push('city');
    if (state) appliedFilters.push('state');
    if (country) appliedFilters.push('country');
    if (userType) appliedFilters.push('userType');
    if (adminRole) appliedFilters.push('adminRole');
    if (isActive !== undefined) appliedFilters.push('isActive');
    if (emailVerified !== undefined) appliedFilters.push('emailVerified');
    if (phoneVerified !== undefined) appliedFilters.push('phoneVerified');
    if (identityVerified !== undefined) appliedFilters.push('identityVerified');
    if (gender) appliedFilters.push('gender');
    if (preferredLanguage) appliedFilters.push('preferredLanguage');
    if (createdFrom || createdTo) appliedFilters.push('createdDateRange');
    if (lastLoginFrom || lastLoginTo) appliedFilters.push('lastLoginDateRange');

    // Convert Decimal values to numbers for JSON serialization
    const processedUsers = users.map(user => ({
      ...user,
      wallet: user.wallet ? {
        ...user.wallet,
        balance: Number(user.wallet.balance)
      } : user.wallet,
    }));

    return {
      data: processedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: appliedFilters.length > 0 ? {
        applied: appliedFilters,
        ...filters,
      } : undefined,
    };
  }
}
