import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
@ApiTags('admin-auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticate an administrator account and receive JWT tokens with permissions'
  })
  @ApiBody({
    type: AdminLoginDto,
    description: 'Admin login credentials'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        admin: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'admin@uberclone.com' },
            userType: { type: 'string', example: 'admin' },
            adminRole: { type: 'string', example: 'admin' },
            adminPermissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['user:read', 'user:write']
            },
            lastAdminLogin: { type: 'string', format: 'date-time' }
          }
        },
        expiresIn: { type: 'number', example: 3600 }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account deactivated',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['email should not be empty'] }
      }
    }
  })
  async login(@Body() loginDto: AdminLoginDto) {
    this.logger.log(`Admin login attempt for email: ${loginDto.email}`);
    return this.adminService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin logout',
    description: 'Log out the current admin session'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  async logout() {
    // En una implementación más completa, aquí invalidaríamos el token
    // Por ahora, solo retornamos un mensaje de éxito
    this.logger.log('Admin logout');
    return {
      message: 'Logged out successfully',
      success: true,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh admin token',
    description: 'Refresh the access token using a valid refresh token'
  })
  @ApiBody({
    description: 'Refresh token data',
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Valid refresh token'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        admin: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'admin@uberclone.com' },
            adminRole: { type: 'string', example: 'admin' },
            adminPermissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['user:read', 'user:write']
            }
          }
        },
        expiresIn: { type: 'number', example: 3600 }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid or missing refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'refreshToken should not be empty' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid refresh token' }
      }
    }
  })
  async refresh(@Body('refreshToken') refreshToken: string) {
    // TODO: Implementar refresh token logic
    this.logger.log('Admin token refresh attempt');
    return {
      message: 'Token refresh not yet implemented',
      success: false,
    };
  }

  // Endpoint temporal para testing sin autenticación
  @Post('test-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test login credentials',
    description: 'Get test admin credentials for development and testing purposes (development only)'
  })
  @ApiBody({
    description: 'Any login data for testing',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        password: { type: 'string', example: 'testpass' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Test credentials provided',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Test login endpoint - use regular login endpoint'
        },
        credentials: {
          type: 'object',
          properties: {
            superadmin: {
              type: 'string',
              example: 'superadmin@uberclone.com / SuperAdmin123!'
            },
            admin: {
              type: 'string',
              example: 'admin@uberclone.com / Admin123!'
            },
            moderator: {
              type: 'string',
              example: 'moderator@uberclone.com / Moderator123!'
            },
            support: {
              type: 'string',
              example: 'support@uberclone.com / Support123!'
            }
          }
        }
      }
    }
  })
  async testLogin(@Body() loginDto: any) {
    this.logger.log('Test login attempt');

    // Verificar que el servicio esté funcionando
    try {
      // Crear un token de prueba para verificar que JWT esté funcionando
      const testPayload = { test: true, timestamp: Date.now() };
      const testToken = await this.adminService.generateTestToken(testPayload);

      return {
        message: 'Test login endpoint - use regular login endpoint',
        credentials: {
          superadmin: 'superadmin@uberclone.com / SuperAdmin123!',
          admin: 'admin@uberclone.com / Admin123!',
          moderator: 'moderator@uberclone.com / Moderator123!',
          support: 'support@uberclone.com / Support123!',
        },
        jwtConfig: {
          secret: process.env.JWT_SECRET ? 'CONFIGURED' : 'NOT_CONFIGURED',
          expiresIn: process.env.JWT_EXPIRES_IN || '1h',
          refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        },
        testToken: {
          generated: !!testToken,
          length: testToken ? testToken.length : 0,
          preview: testToken ? testToken.substring(0, 30) + '...' : 'N/A'
        }
      };
    } catch (error) {
      return {
        message: 'Error generating test token',
        error: error.message,
        credentials: {
          superadmin: 'superadmin@uberclone.com / SuperAdmin123!',
          admin: 'admin@uberclone.com / Admin123!',
          moderator: 'moderator@uberclone.com / Moderator123!',
          support: 'support@uberclone.com / Support123!',
        }
      };
    }
  }

}
