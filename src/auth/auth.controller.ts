import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RegisterResult, LoginResult } from './interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario con email y contraseña en el sistema de autenticación interno'
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Datos de registro del usuario'
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'usuario@example.com' },
            name: { type: 'string', example: 'Juan Pérez' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['users:read', 'users:read:own']
            },
            groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 4 },
                  name: { type: 'string', example: 'Usuario Estándar' },
                  priority: { type: 'number', example: 0 }
                }
              }
            }
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResult> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario con email y contraseña en el sistema de autenticación interno'
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciales de inicio de sesión'
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'usuario@example.com' },
            name: { type: 'string', example: 'Juan Pérez' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['users:read', 'users:read:own', 'rides:create']
            },
            groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 4 },
                  name: { type: 'string', example: 'Usuario Estándar' },
                  priority: { type: 'number', example: 0 }
                }
              }
            }
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResult> {
    console.log('Login DTO received:', JSON.stringify(loginDto, null, 2)); // Debug log
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({
    summary: 'Refrescar token',
    description: 'Genera un nuevo access token usando el refresh token'
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token para obtener un nuevo access token'
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refrescados exitosamente',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'usuario@example.com' },
            name: { type: 'string', example: 'Juan Pérez' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['users:read', 'users:read:own']
            },
            groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 4 },
                  name: { type: 'string', example: 'Usuario Estándar' },
                  priority: { type: 'number', example: 0 }
                }
              }
            }
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string; user: { id: number; email: string; name: string; permissions: string[]; groups: { id: number; name: string; priority: number; }[] } }> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Obtiene la información del perfil del usuario autenticado en el sistema interno'
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Juan Pérez' },
        email: { type: 'string', example: 'usuario@example.com' },
        clerkId: { type: 'string', nullable: true, example: null },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['users:read', 'users:read:own', 'rides:create', 'analytics:read']
        },
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 4 },
              name: { type: 'string', example: 'Usuario Estándar' },
              priority: { type: 'number', example: 0 }
            }
          }
        },
        wallet: {
          type: 'object',
          nullable: true,
          properties: {
            balance: { type: 'number', example: 50.00 }
          }
        },
        emergencyContacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'María García' },
              phone: { type: 'string', example: '+584241234567' }
            }
          }
        }
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token del usuario (implementación básica)'
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sesión cerrada exitosamente' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async logout(): Promise<{ message: string }> {
    // TODO: Implementar invalidación de tokens en una base de datos negra
    // Por ahora solo retornamos un mensaje de éxito
    return { message: 'Sesión cerrada exitosamente' };
  }
}
