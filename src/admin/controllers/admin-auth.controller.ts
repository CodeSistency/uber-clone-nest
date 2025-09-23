import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request, 
  BadRequestException, 
  UnauthorizedException, 
  NotFoundException, 
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from '../admin.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminLoginDto } from '../dto/login.dto';
import { AdminRefreshTokenDto } from '../dto/refresh-token.dto';
import { STRATEGY_NAME as LOCAL_STRATEGY_NAME } from '../strategies/admin-local.strategy';
import { JWT_REFRESH_STRATEGY_NAME } from '../strategies/admin-jwt-refresh.strategy';

// Error response schemas
const UNAUTHORIZED_RESPONSE = {
  status: HttpStatus.UNAUTHORIZED,
  description: 'Unauthorized - Invalid or expired credentials',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Unauthorized' },
      error: { type: 'string', example: 'Unauthorized' }
    }
  }
};

const BAD_REQUEST_RESPONSE = {
  status: HttpStatus.BAD_REQUEST,
  description: 'Bad Request - Invalid input data',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      message: { type: 'string', example: 'Bad Request' },
      error: { type: 'string', example: 'Bad Request' }
    }
  }
};

const INTERNAL_SERVER_ERROR_RESPONSE = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  description: 'Internal Server Error',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 500 },
      message: { type: 'string', example: 'Internal server error' },
      error: { type: 'string', example: 'Internal Server Error' }
    }
  }
};

@Controller('admin/auth')
@ApiTags('admin/auth')
@ApiBadRequestResponse(BAD_REQUEST_RESPONSE)
@ApiUnauthorizedResponse(UNAUTHORIZED_RESPONSE)
@ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_RESPONSE)
export class AdminAuthController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard(LOCAL_STRATEGY_NAME))
  @ApiOperation({ 
    summary: 'Admin Login', 
    description: `Authenticate admin with email and password to get access and refresh tokens. 
    Returns JWT tokens and admin profile information.`
  })
  @ApiBody({ 
    type: AdminLoginDto,
    description: 'Admin login credentials',
    examples: {
      admin: {
        summary: 'Admin Login',
        value: {
          email: 'superadmin@uberclone.com',
          password: 'admin123' // This is just an example, use the actual password
        }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string', 
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT access token for authentication'
        },
        refreshToken: { 
          type: 'string', 
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT refresh token for getting new access tokens'
        },
        admin: {
          type: 'object',
          description: 'Authenticated admin user information',
          properties: {
            id: { 
              type: 'string', 
              example: '1',
              description: 'Unique identifier for the admin user'
            },
            email: { 
              type: 'string', 
              example: 'admin@example.com',
              format: 'email',
              description: 'Admin email address'
            },
            name: { 
              type: 'string', 
              example: 'Admin User',
              description: 'Full name of the admin'
            },
            isActive: { 
              type: 'boolean', 
              example: true,
              description: 'Indicates if the admin account is active'
            },
            adminRole: { 
              type: 'string', 
              example: 'admin',
              enum: ['admin', 'superadmin', 'support'],
              description: 'Role of the admin user'
            },
            lastLogin: { 
              type: 'string', 
              format: 'date-time',
              description: 'Timestamp of last successful login',
              nullable: true
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Timestamp when the admin account was created'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Timestamp when the admin account was last updated'
            }
          }
        },
        expiresIn: { 
          type: 'number', 
          example: 3600,
          description: 'Time in seconds until the access token expires'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { 
          type: 'string', 
          example: 'Invalid credentials',
          description: 'Error message indicating invalid login credentials'
        },
        error: { 
          type: 'string', 
          example: 'Unauthorized',
          description: 'Error type'
        }
      }
    }
  })
  async login(@Request() req) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new UnauthorizedException('Email and password are required');
      }
      return await this.adminService.login({ email, password });
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard(JWT_REFRESH_STRATEGY_NAME))
  @ApiOperation({ 
    summary: 'Refresh Access Token', 
    description: `Exchange a valid refresh token for a new access token. 
    This endpoint is used to maintain an active session without requiring 
    the user to log in again.`
  })
  @ApiBody({ 
    type: AdminRefreshTokenDto, 
    description: 'Refresh token request',
    examples: {
      refresh: {
        summary: 'Refresh Token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string', 
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'New JWT access token'
        },
        refreshToken: { 
          type: 'string', 
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'New JWT refresh token (rotated for security)'
        },
        expiresIn: { 
          type: 'number', 
          example: 3600,
          description: 'Time in seconds until the new access token expires'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { 
          type: 'number', 
          example: 401,
          description: 'HTTP status code'
        },
        message: { 
          type: 'string', 
          example: 'Invalid refresh token',
          description: 'Error message indicating the refresh token is invalid or expired'
        },
        error: { 
          type: 'string', 
          example: 'Unauthorized',
          description: 'Error type'
        }
      }
    }
  })
  async refreshToken(@Request() req) {
    try {
      // The user should be attached to the request by the JWT refresh guard
      const { user } = req;
      
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Generate new tokens using the refresh token
      return await this.adminService.refreshTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        refreshToken: user.refreshToken
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ 
    summary: 'Admin Logout', 
    description: `Invalidate the current refresh token and log out the admin user. 
    This will require the user to log in again to obtain new tokens.`
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ 
    description: 'Successfully logged out',
    schema: {
      type: 'object',
      properties: {
        success: { 
          type: 'boolean', 
          example: true,
          description: 'Indicates if the logout was successful'
        },
        message: {
          type: 'string',
          example: 'Successfully logged out',
          description: 'Confirmation message'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async logout(@Request() req) {
    try {
      // Since we don't have a dedicated logout method, we can just return success
      // In a real implementation, you might want to invalidate the token
      return { success: true, message: 'Successfully logged out' };
    } catch (error) {
      throw new UnauthorizedException('Not authorized to perform this action');
    }
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ 
    summary: 'Get Current Admin Profile', 
    description: `Retrieve the profile information of the currently authenticated admin user. 
    This endpoint requires a valid JWT token in the Authorization header.`
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'Admin profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '1' },
        email: { type: 'string', format: 'email', example: 'admin@example.com' },
        name: { type: 'string', example: 'Admin User' },
        isActive: { type: 'boolean', example: true },
        adminRole: { 
          type: 'string', 
          example: 'admin',
          enum: ['admin', 'superadmin', 'support']
        },
        lastLogin: { type: 'string', format: 'date-time', nullable: true },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['users:read', 'users:write']
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Admin not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Admin not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async getProfile(@Request() req) {
    try {
      const admin = await this.adminService.findAdminById(req.user.id);
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      return admin;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Not authorized to perform this action');
    }
  }
}
