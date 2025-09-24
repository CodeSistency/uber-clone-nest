import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene el perfil del administrador autenticado
   * @param adminId ID del administrador
   * @returns Información del perfil del administrador
   */
  async getProfile(adminId: number) {
    const admin = await this.prisma.user.findUnique({
      where: {
        id: adminId,
        userType: 'admin',
      },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        adminPermissions: true,
        lastLogin: true,
        lastAdminLogin: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    return admin;
  }

  /**
   * Actualiza el perfil del administrador autenticado
   * @param adminId ID del administrador
   * @param updateProfileDto Datos actualizados del perfil
   * @returns Perfil actualizado
   */
  async updateProfile(adminId: number, updateProfileDto: UpdateProfileDto) {
    const { name, email, currentPassword, newPassword } = updateProfileDto;
    const updateData: any = {};

    // Verificar que el administrador existe
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId, userType: 'admin' },
      select: { email: true, password: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    // Actualizar nombre si se proporciona
    if (name) {
      updateData.name = name;
    }

    // Actualizar email si se proporciona y es diferente al actual
    if (email && email !== admin.email) {
      // Verificar que el nuevo email no esté en uso
      const emailInUse = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (emailInUse) {
        throw new ConflictException('Email already in use');
      }

      updateData.email = email;
      updateData.emailVerified = false; // Requiere verificación del nuevo email
    }

    // Actualizar contraseña si se proporciona la actual
    if (currentPassword && newPassword && admin.password) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        admin.password,
      );

      if (!isPasswordValid) {
        throw new ConflictException('Current password is incorrect');
      }

      updateData.password = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    }

    // Si no hay nada que actualizar, retornar el perfil actual
    if (Object.keys(updateData).length === 0) {
      return this.getProfile(adminId);
    }

    // Actualizar el perfil
    const updatedAdmin = await this.prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Updated profile for admin ID: ${adminId}`);
    return updatedAdmin;
  }
}
