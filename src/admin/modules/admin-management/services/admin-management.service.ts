import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto } from '../dtos/create-admin.dto';
import { UpdateAdminDto } from '../dtos/update-admin.dto';

@Injectable()
export class AdminManagementService {
  private readonly logger = new Logger(AdminManagementService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo administrador en el sistema
   * @param createAdminDto Datos del administrador a crear
   * @returns El administrador creado
   */
  async createAdmin(createAdminDto: CreateAdminDto) {
    const { email, password, name, adminRole, adminPermissions } = createAdminDto;

    // Verificar si el correo ya está en uso
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Crear el administrador
    const admin = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        userType: 'admin',
        isActive: true,
        adminRole,
        adminPermissions: adminPermissions || [],
        emailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        adminRole: true,
        adminPermissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Created new admin with ID: ${admin.id}`);
    return admin;
  }

  /**
   * Obtiene todos los administradores del sistema
   * @returns Lista de administradores
   */
  async getAllAdmins() {
    return this.prisma.user.findMany({
      where: {
        userType: 'admin',
      },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        adminPermissions: true,
        isActive: true,
        lastLogin: true,
        lastAdminLogin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtiene un administrador por su ID
   * @param id ID del administrador
   * @returns El administrador solicitado
   */
  async getAdminById(id: number) {
    const admin = await this.prisma.user.findUnique({
      where: {
        id,
        userType: 'admin',
      },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        adminPermissions: true,
        isActive: true,
        lastLogin: true,
        lastAdminLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  /**
   * Actualiza la información de un administrador
   * @param id ID del administrador a actualizar
   * @param updateAdminDto Datos actualizados del administrador
   * @returns El administrador actualizado
   */
  async updateAdmin(id: number, updateAdminDto: UpdateAdminDto) {
    // Verificar que el administrador existe
    const existingAdmin = await this.prisma.user.findUnique({
      where: { id, userType: 'admin' },
    });

    if (!existingAdmin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Si se está actualizando el correo, verificar que no esté en uso
    if (updateAdminDto.email && updateAdminDto.email !== existingAdmin.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: updateAdminDto.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email already in use');
      }
    }

    // Preparar datos para actualizar
    const updateData: any = { ...updateAdminDto };

    // Si se está actualizando la contraseña, hashearla
    if (updateAdminDto.password) {
      updateData.password = await bcrypt.hash(updateAdminDto.password, this.SALT_ROUNDS);
    }

    // Actualizar el administrador
    const updatedAdmin = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        adminPermissions: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Updated admin with ID: ${id}`);
    return updatedAdmin;
  }

  /**
   * Elimina un administrador (soft delete)
   * @param id ID del administrador a eliminar
   */
  async deleteAdmin(id: number) {
    // Verificar que el administrador existe
    const admin = await this.prisma.user.findUnique({
      where: { id, userType: 'admin' },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // No permitir eliminar el último administrador activo
    const activeAdmins = await this.prisma.user.count({
      where: {
        userType: 'admin',
        isActive: true,
      },
    });

    if (activeAdmins <= 1 && admin.isActive) {
      throw new BadRequestException('Cannot delete the last active admin');
    }

    // Realizar soft delete (convertir a usuario regular o desactivar)
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        adminRole: null,
        adminPermissions: [],
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Deleted (soft) admin with ID: ${id}`);
  }
}
