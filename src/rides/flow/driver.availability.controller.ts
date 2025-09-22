import { Body, Controller, Get, Post, Put, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { PermissionsGuard } from '../../admin/guards/permissions.guard';
import { RequirePermissions } from '../../admin/decorators/permissions.decorator';
import { Permission } from '../../admin/entities/admin.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { SetDriverAvailabilityDto } from './dto/transport-flow.dtos';

@ApiTags('driver-availability')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/driver')
export class DriverAvailabilityController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('availability')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🚗 Establecer disponibilidad del conductor (Para conductores)',
    description: `
    **IMPORTANTE:** Este endpoint es para que el CONDUCTOR cambie SU PROPIO estado de disponibilidad.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Para qué sirve?**
    Permite al conductor cambiar su estado de disponibilidad en la plataforma.

    **Estados disponibles:**
    - \`online\`: Conductor disponible para recibir viajes
    - \`offline\`: Conductor desconectado, no recibe viajes
    - \`busy\`: Conductor ocupado temporalmente

    **¿Cómo funciona?**
    - El conductor debe estar autenticado con su token JWT
    - El sistema identifica automáticamente al conductor usando el token
    - **NO es necesario enviar el ID del conductor** (se obtiene del token)

    **Ejemplos de uso:**
    - Conductor inicia su turno: \`online\`
    - Conductor termina su turno: \`offline\`
    - Conductor en descanso: \`busy\`

    **⚠️ NOTA:** Si buscas cambiar el status de OTRO conductor (como admin), usa:
    \`PUT /api/driver/{driverId}/status\`
    `
  })
  @ApiBody({
    type: SetDriverAvailabilityDto,
    examples: {
      'go_online': {
        summary: 'Ponerse en línea (disponible)',
        description: 'Conductor listo para recibir viajes',
        value: { status: 'online' }
      },
      'go_offline': {
        summary: 'Desconectarse',
        description: 'Conductor termina su turno',
        value: { status: 'offline' }
      },
      'take_break': {
        summary: 'Tomar descanso',
        description: 'Conductor ocupado temporalmente',
        value: { status: 'busy' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1, description: 'ID del conductor' },
            status: {
              type: 'string',
              example: 'online',
              enum: ['online', 'offline', 'busy'],
              description: 'Nuevo estado de disponibilidad'
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Token inválido o expirado' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Usuario no es un conductor registrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'User is not a driver' }
      }
    }
  })
  async setAvailability(@Body() body: SetDriverAvailabilityDto, @Req() req: any) {
    const driver = await this.prisma.driver.update({
      where: { id: Number(req.user.id) },
      data: { status: body.status },
    });
    return { data: { id: driver.id, status: driver.status } };
  }

  @Get('availability')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '👀 Consultar disponibilidad del conductor (Para conductores)',
    description: `
    **IMPORTANTE:** Este endpoint permite al CONDUCTOR consultar SU PROPIO estado de disponibilidad.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué devuelve?**
    - ID del conductor
    - Estado actual de disponibilidad

    **Estados posibles:**
    - \`online\`: Disponible para viajes
    - \`offline\`: Desconectado
    - \`busy\`: Ocupado temporalmente

    **¿Cómo funciona?**
    - El conductor debe estar autenticado con su token JWT
    - El sistema identifica automáticamente al conductor usando el token
    - **NO es necesario enviar el ID del conductor** (se obtiene del token)
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1, description: 'ID del conductor' },
            status: {
              type: 'string',
              example: 'online',
              enum: ['online', 'offline', 'busy'],
              description: 'Estado actual de disponibilidad'
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Token inválido o expirado' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Usuario no es un conductor registrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'User is not a driver' }
      }
    }
  })
  async getAvailability(@Req() req: any) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, status: true },
    });
    return { data: driver };
  }

  // =========================================
  // ENDPOINTS PARA ADMINISTRADORES
  // =========================================

  @Put('admin/availability/:driverId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.DRIVER_WRITE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '👑 Administrar disponibilidad de cualquier conductor',
    description: `
    **IMPORTANTE:** Este endpoint es para ADMINISTRADORES que necesitan gestionar el status de conductores.

    **¿Para qué sirve?**
    Permite a administradores cambiar el estado de disponibilidad de cualquier conductor registrado.

    **Casos de uso:**
    - Suspender conductor por mal comportamiento
    - Reactivar conductor después de verificación
    - Cambiar status por mantenimiento técnico
    - Gestionar conductores en situaciones de emergencia

    **Permisos requeridos:**
    - \`driver:write\` - Permiso para modificar datos de conductores

    **Estados disponibles:**
    - \`online\`: Conductor disponible para viajes
    - \`offline\`: Conductor desconectado
    - \`busy\`: Conductor ocupado temporalmente
    `
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID único del conductor a gestionar',
    example: 1,
    type: Number,
    required: true
  })
  @ApiBody({
    type: SetDriverAvailabilityDto,
    examples: {
      'suspend_driver': {
        summary: 'Suspender conductor (poner offline)',
        description: 'Cambiar conductor a offline por mantenimiento',
        value: { status: 'offline' }
      },
      'activate_driver': {
        summary: 'Activar conductor (poner online)',
        description: 'Reactivar conductor después de verificación',
        value: { status: 'online' }
      },
      'busy_driver': {
        summary: 'Marcar conductor como ocupado',
        description: 'Poner conductor en estado busy temporalmente',
        value: { status: 'busy' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad del conductor actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1, description: 'ID del conductor' },
            status: {
              type: 'string',
              example: 'offline',
              enum: ['online', 'offline', 'busy'],
              description: 'Nuevo estado de disponibilidad'
            },
            updatedBy: {
              type: 'object',
              properties: {
                adminId: { type: 'number', example: 5 },
                adminEmail: { type: 'string', example: 'admin@uberclone.com' },
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        message: { type: 'string', example: 'Driver status updated successfully' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Token inválido o expirado' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para gestionar conductores',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'You do not have the required permissions' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Conductor no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Driver not found' }
      }
    }
  })
  async adminSetDriverAvailability(
    @Param('driverId') driverId: string,
    @Body() body: SetDriverAvailabilityDto,
    @Req() req: any
  ) {
    console.log(`👑 Admin setting driver availability: driverId=${driverId}, status=${body.status}`);

    // Verificar que el driver existe
    const existingDriver = await this.prisma.driver.findUnique({
      where: { id: Number(driverId) },
    });

    if (!existingDriver) {
      throw new Error(`Driver with id ${driverId} not found`);
    }

    // Actualizar el status del driver
    const driver = await this.prisma.driver.update({
      where: { id: Number(driverId) },
      data: { status: body.status },
    });

    console.log(`✅ Driver ${driverId} status updated to ${body.status} by admin ${req.admin?.email}`);

    return {
      data: {
        id: driver.id,
        status: driver.status,
        updatedBy: {
          adminId: req.admin?.id,
          adminEmail: req.admin?.email,
          timestamp: new Date()
        }
      },
      message: 'Driver status updated successfully'
    };
  }

  @Get('admin/availability/:driverId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '👀 Consultar disponibilidad de cualquier conductor (Admin)',
    description: `
    **IMPORTANTE:** Este endpoint permite a ADMINISTRADORES consultar el status de cualquier conductor.

    **¿Para qué sirve?**
    Permite a administradores monitorear el estado de disponibilidad de conductores específicos.

    **Permisos requeridos:**
    - \`driver:read\` - Permiso para consultar datos de conductores

    **Información devuelta:**
    - ID del conductor
    - Estado actual de disponibilidad
    - Información del conductor (opcional)
    `
  })
  @ApiParam({
    name: 'driverId',
    description: 'ID único del conductor a consultar',
    example: 1,
    type: Number,
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad del conductor obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1, description: 'ID del conductor' },
            status: {
              type: 'string',
              example: 'online',
              enum: ['online', 'offline', 'busy'],
              description: 'Estado actual de disponibilidad'
            },
            driver: {
              type: 'object',
              properties: {
                firstName: { type: 'string', example: 'Carlos' },
                lastName: { type: 'string', example: 'Rodriguez' },
                carModel: { type: 'string', example: 'Toyota Camry' },
                verificationStatus: { type: 'string', example: 'verified' },
                canDoDeliveries: { type: 'boolean', example: true }
              }
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Token inválido o expirado' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para consultar conductores',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'You do not have the required permissions' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Conductor no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Driver not found' }
      }
    }
  })
  async adminGetDriverAvailability(@Param('driverId') driverId: string) {
    console.log(`👀 Admin checking driver availability: driverId=${driverId}`);

    const driver = await this.prisma.driver.findUnique({
      where: { id: Number(driverId) },
      select: {
        id: true,
        status: true,
        firstName: true,
        lastName: true,
        carModel: true,
        verificationStatus: true,
        canDoDeliveries: true,
        updatedAt: true
      },
    });

    if (!driver) {
      throw new Error(`Driver with id ${driverId} not found`);
    }

    console.log(`✅ Driver ${driverId} status retrieved: ${driver.status}`);

    return {
      data: {
        id: driver.id,
        status: driver.status,
        driver: {
          firstName: driver.firstName,
          lastName: driver.lastName,
          carModel: driver.carModel,
          verificationStatus: driver.verificationStatus,
          canDoDeliveries: driver.canDoDeliveries,
          lastUpdated: driver.updatedAt
        }
      }
    };
  }

  // =========================================
  // ENDPOINT PARA CONVERTIR USUARIO EN CONDUCTOR
  // =========================================

  @Post('become-driver')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Convertir usuario actual en conductor (para testing)',
    description: `
    **IMPORTANTE:** Este endpoint es para TESTING. Convierte al usuario autenticado en un conductor.

    **¿Qué hace?**
    - Verifica si el usuario ya es conductor
    - Si no lo es, crea un registro de conductor con datos básicos
    - Establece el status inicial como 'online'

    **Campos que se crean:**
    - firstName: Del nombre del usuario
    - lastName: 'Driver' (por defecto)
    - carModel: 'Toyota Camry' (por defecto)
    - licensePlate: 'TEST-123' (por defecto)
    - carSeats: 4 (por defecto)
    - status: 'online'
    - verificationStatus: 'verified'

    **Después de usar este endpoint:**
    - El usuario podrá usar todos los endpoints de conductores
    - Podrá ver carreras disponibles
    - Podrá aceptar viajes
    `
  })
  @ApiBody({
    type: SetDriverAvailabilityDto,
    examples: {
      'default': {
        summary: 'Convertir a conductor con configuración por defecto',
        description: 'Se creará un conductor con datos básicos de prueba',
        value: { status: 'online' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario convertido exitosamente en conductor',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'Test' },
            lastName: { type: 'string', example: 'Driver' },
            status: { type: 'string', example: 'online' },
            message: { type: 'string', example: 'User successfully converted to driver' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya es un conductor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User is already a driver' }
      }
    }
  })
  async becomeDriver(@Req() req: any, @Body() body: SetDriverAvailabilityDto) {
    console.log(`🚗 Converting user ${req.user.id} to driver`);

    // Check if user is already a driver
    const existingDriver = await this.prisma.driver.findUnique({
      where: { id: req.user.id }
    });

    if (existingDriver) {
      return {
        statusCode: 409,
        message: 'User is already a driver',
        data: existingDriver
      };
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create driver record
    const driver = await this.prisma.driver.create({
      data: {
        id: req.user.id,
        firstName: user.name?.split(' ')[0] || 'Test',
        lastName: user.name?.split(' ')[1] || 'Driver',
        carModel: 'Toyota Camry',
        licensePlate: 'TEST-123',
        carSeats: 4,
        status: body.status,
        verificationStatus: 'verified',
        canDoDeliveries: true
      }
    });

    console.log(`✅ User ${req.user.id} converted to driver with ID: ${driver.id}`);

    return {
      data: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        status: driver.status,
        message: 'User successfully converted to driver'
      }
    };
  }
}


