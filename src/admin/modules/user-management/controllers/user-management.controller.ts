import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { AdminPermission } from '../../../interfaces/admin.interface';

import { UserManagementService } from '../services/user-management.service';
import {
  GetUsersQueryDto,
  UpdateUserStatusDto,
  AdjustWalletDto,
  AddEmergencyContactDto,
  BulkUpdateStatusDto,
  DeleteUserDto,
  RestoreUserDto,
  UserListResponseDto,
  UserDetailsDto,
} from '../dtos/user-management.dto';

import { UserDetails } from '../services/user-management.service';

@ApiTags('Admin User Management')
@Controller('admin/users')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @RequirePermissions(AdminPermission.USERS_READ)
  @ApiOperation({
    summary: 'Listar usuarios con filtros',
    description:
      'Obtiene una lista paginada de usuarios con filtros avanzados para administración',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    type: UserListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async getUsers(
    @Query() query: GetUsersQueryDto,
  ): Promise<UserListResponseDto> {
    const filters = {
      status: query.status,
      emailVerified: query.emailVerified,
      phoneVerified: query.phoneVerified,
      identityVerified: query.identityVerified,
      hasWallet: query.hasWallet,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      minRides: query.minRides,
      maxRides: query.maxRides,
      search: query.search,
    };

    return this.userManagementService.getUsersWithFilters(
      filters,
      query.page || 1,
      query.limit || 20,
    );
  }

  @Get(':id')
  @RequirePermissions(AdminPermission.USERS_READ)
  @ApiOperation({
    summary: 'Obtener detalles de un usuario',
    description:
      'Obtiene información completa de un usuario específico incluyendo wallet, contactos de emergencia, etc.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del usuario obtenidos exitosamente',
    type: UserDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async getUserDetails(
    @Param('id', ParseIntPipe) userId: number,
  ): Promise<UserDetailsDto> {
    const details = await this.userManagementService.getUserDetails(userId);

    // Format the response
    return {
      basic: {
        id: details.id,
        name: details.name,
        email: details.email,
        phone: details.phone,
        dateOfBirth: details.dateOfBirth,
        gender: details.gender,
        isActive: details.isActive,
        emailVerified: details.emailVerified,
        phoneVerified: details.phoneVerified,
        identityVerified: details.identityVerified,
        lastLogin: details.lastLogin,
        createdAt: details.createdAt,
      },
      address: {
        profileImage: details.profileImage,
        address: details.address,
        city: details.city,
        state: details.state,
        country: details.country,
        postalCode: details.postalCode,
      },
      preferences: {
        preferredLanguage: details.preferredLanguage,
        timezone: details.timezone,
        currency: details.currency,
      },
      stats: {
        totalRides: details.totalRides,
        completedRides: details.completedRides,
        cancelledRides: details.cancelledRides,
        averageRating: details.averageRating,
      },
      wallet: details.wallet,
      emergencyContacts: details.emergencyContacts,
      recentRides: details.recentRides,
    };
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.USERS_SUSPEND)
  @ApiOperation({
    summary: 'Actualizar estado de usuario',
    description: 'Activa o suspende la cuenta de un usuario',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async updateUserStatus(
    @Param('id', ParseIntPipe) userId: number,
    @Body() statusDto: UpdateUserStatusDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.userManagementService.updateUserStatus(
      userId,
      statusDto.isActive,
      adminId,
      statusDto.reason,
    );
  }

  @Post(':id/wallet/adjust')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @ApiOperation({
    summary: 'Ajustar balance de wallet',
    description: 'Agrega o sustrae fondos del wallet de un usuario',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Balance del wallet ajustado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async adjustWalletBalance(
    @Param('id', ParseIntPipe) userId: number,
    @Body() adjustDto: AdjustWalletDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.userManagementService.adjustWalletBalance(
      userId,
      adjustDto.amount,
      adminId,
      adjustDto.reason,
      adjustDto.description,
    );
  }

  @Post(':id/emergency-contacts')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @ApiOperation({
    summary: 'Agregar contacto de emergencia',
    description: 'Agrega un nuevo contacto de emergencia para un usuario',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Contacto de emergencia agregado exitosamente',
  })
  async addEmergencyContact(
    @Param('id', ParseIntPipe) userId: number,
    @Body() contactDto: AddEmergencyContactDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.userManagementService.addEmergencyContact(
      userId,
      contactDto.contactName,
      contactDto.contactPhone,
      adminId,
    );
  }

  @Delete('emergency-contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @ApiOperation({
    summary: 'Eliminar contacto de emergencia',
    description: 'Elimina un contacto de emergencia de un usuario',
  })
  @ApiParam({
    name: 'contactId',
    description: 'ID del contacto de emergencia',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Contacto de emergencia eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Contacto no encontrado',
  })
  async removeEmergencyContact(
    @Param('contactId', ParseIntPipe) contactId: number,
    // @Req() req: Request
  ): Promise<void> {
    const adminId = 1; // Should come from JWT

    return this.userManagementService.removeEmergencyContact(
      contactId,
      adminId,
    );
  }

  @Post('bulk/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.USERS_SUSPEND)
  @ApiOperation({
    summary: 'Actualizar estado de múltiples usuarios',
    description:
      'Activa o suspende múltiples cuentas de usuario en una operación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estados de usuarios actualizados exitosamente',
  })
  async bulkUpdateUserStatus(
    @Body() bulkDto: BulkUpdateStatusDto,
    // @Req() req: Request
  ): Promise<any> {
    const adminId = 1; // Should come from JWT

    return this.userManagementService.bulkUpdateUserStatus(
      bulkDto.userIds,
      bulkDto.isActive,
      adminId,
      bulkDto.reason,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.USERS_SUSPEND)
  @ApiOperation({
    summary: 'Soft Delete de un usuario',
    description: 'Desactiva un usuario (soft delete) manteniendo todos sus datos. El usuario puede ser reactivado posteriormente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del usuario a desactivar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario desactivado exitosamente',
    type: UserDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado o ya está desactivado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes - se requiere permiso users:suspend',
  })
  async softDeleteUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() deleteDto: DeleteUserDto,
    // @Req() req: Request
  ): Promise<UserDetails> {
    const adminId = 1; // Should come from JWT

    return this.userManagementService.softDeleteUser(
      userId,
      adminId,
      deleteDto.reason,
    );
  }

  @Put(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AdminPermission.USERS_SUSPEND)
  @ApiOperation({
    summary: 'Restaurar usuario soft deleted',
    description: 'Restaura un usuario que fue soft deleted, limpiando los campos de eliminación y reactivando la cuenta',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del usuario a restaurar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario restaurado exitosamente',
    type: UserDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado o no está soft deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes - se requiere permiso users:suspend',
  })
  async restoreUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() restoreDto: RestoreUserDto,
    // @Req() req: Request
  ): Promise<UserDetails> {
    const adminId = 1; // Should come from JWT

    return this.userManagementService.restoreUser(
      userId,
      adminId,
      restoreDto.reason,
    );
  }
}
