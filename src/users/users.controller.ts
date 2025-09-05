import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto as CreateBasicUserDto, ClerkAuthCallbackDto } from './dto/create-user-clerk.dto';
import { UpdateUserClerkDto } from './dto/update-user-clerk.dto';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkUser } from './decorators/clerk-user.decorator';

@ApiTags('users')
@Controller('api/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Register/Create a new user' })
  @ApiBody({
    type: CreateBasicUserDto,
    description: 'User registration data (name and email only)'
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              clerkId: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing required fields or invalid data' })
  @ApiResponse({ status: 409, description: 'User already exists with this email' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createUser(
    @Body() createUserDto: CreateBasicUserDto,
  ): Promise<{ data: User[] }> {
    // Verificar si el usuario ya existe por email
    const existingUser = await this.usersService.findUserByEmail(createUserDto.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Generar un ID único temporal para Clerk hasta que se autentique
    const tempClerkId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const user = await this.usersService.createUser({
      name: createUserDto.name,
      email: createUserDto.email,
      clerkId: tempClerkId, // ID temporal que se reemplazará con el real de Clerk
    });
    return { data: [user] };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserById(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findUserById(Number(id));
  }

  @Get('clerk/:clerkId')
  @ApiOperation({ summary: 'Get user by Clerk ID' })
  @ApiParam({ name: 'clerkId', description: 'Clerk user ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserByClerkId(
    @Param('clerkId') clerkId: string,
  ): Promise<User | null> {
    return this.usersService.findUserByClerkId(clerkId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user by email' })
  @ApiQuery({ name: 'email', description: 'User email' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserByEmail(@Query('email') email: string): Promise<User | null> {
    return this.usersService.findUserByEmail(email);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update user information',
    description: 'Update user profile information. Only provided fields will be updated.'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '1',
    type: Number
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User fields to update'
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Updated Name' },
        email: { type: 'string', example: 'updated.email@example.com' },
        clerk_id: { type: 'string', example: 'user_2abc123def456' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(Number(id), data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deleteUser(Number(id));
  }

  @Get(':id/rides')
  @ApiOperation({ summary: 'Get user rides' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User rides retrieved successfully',
  })
  async getUserRides(@Param('id') userId: string): Promise<any[]> {
    return this.usersService.getUserRides(parseInt(userId));
  }

  @Get(':clerkId/orders')
  @ApiOperation({ summary: 'Get user delivery orders' })
  @ApiParam({ name: 'clerkId', description: 'Clerk user ID' })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
  })
  async getUserDeliveryOrders(
    @Param('clerkId') clerkId: string,
  ): Promise<any[]> {
    return this.usersService.getUserDeliveryOrders(clerkId);
  }

  // =========================================
  // ENDPOINTS PARA CLERK AUTHENTICATION
  // =========================================



  @Post('link-clerk')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Link user account with Clerk',
    description: 'Links an existing user account with Clerk authentication by updating the Clerk ID'
  })
  @ApiBody({
    type: ClerkAuthCallbackDto,
    description: 'User data from Clerk authentication (optional fields)'
  })
  @ApiResponse({
    status: 200,
    description: 'User account linked with Clerk successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              clerkId: { type: 'string' },
            },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already linked with Clerk' })
  async linkWithClerk(
    @ClerkUser() clerkId: string,
    @Body() createUserDto: CreateBasicUserDto,
  ): Promise<{ data: User[]; message: string }> {
    // Buscar usuario por email
    const existingUser = await this.usersService.findUserByEmail(createUserDto.email);
    if (!existingUser) {
      throw new Error('User not found with this email');
    }

    // Verificar si el usuario ya tiene un Clerk ID real (no temporal)
    if (existingUser.clerkId && !existingUser.clerkId.startsWith('temp_')) {
      throw new Error('User already linked with Clerk');
    }

    // Verificar si el Clerk ID ya está siendo usado por otro usuario
    const clerkUserExists = await this.usersService.findUserByClerkId(clerkId);
    if (clerkUserExists && clerkUserExists.id !== existingUser.id) {
      throw new Error('Clerk ID already linked to another user');
    }

    // Actualizar el usuario con el Clerk ID real
    const updatedUser = await this.usersService.linkUserWithClerk(existingUser.id, clerkId);

    return {
      data: [updatedUser],
      message: 'User account linked with Clerk successfully'
    };
  }

  @Post('auth/callback')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Handle Clerk authentication callback',
    description: 'Called after Clerk authentication. Creates or updates user in database.'
  })
  @ApiBody({
    type: ClerkAuthCallbackDto,
    description: 'User data from Clerk authentication (optional fields)'
  })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              clerkId: { type: 'string' },
            },
          },
        },
        message: { type: 'string' },
        isNewUser: { type: 'boolean' },
      },
    },
  })
  async handleAuthCallback(
    @ClerkUser() clerkId: string,
    @Body() userData: ClerkAuthCallbackDto
  ): Promise<{ data: User[]; message: string; isNewUser: boolean }> {
    // Buscar usuario por Clerk ID
    let user = await this.usersService.findUserByClerkId(clerkId);

    if (user) {
      // Usuario existente - actualizar información si es necesario
      if (userData.name && userData.name !== user.name) {
        user = await this.usersService.updateUser(user.id, {
          name: userData.name,
        });
      }
      return {
        data: [user],
        message: 'Welcome back! User authenticated successfully',
        isNewUser: false,
      };
    }

    // Usuario nuevo - verificar si ya existe por email (usuario registrado previamente)
    if (userData.email) {
      const existingUser = await this.usersService.findUserByEmail(userData.email);
      if (existingUser) {
        // Vincular cuenta existente con Clerk ID
        user = await this.usersService.linkUserWithClerk(existingUser.id, clerkId);
        return {
          data: [user],
          message: 'Account linked successfully! Welcome back',
          isNewUser: false,
        };
      }
    }

    // Crear nuevo usuario
    user = await this.usersService.createUser({
      name: userData.name || 'User',
      email: userData.email || '',
      clerkId: clerkId,
    });

    return {
      data: [user],
      message: 'Welcome! New account created successfully',
      isNewUser: true,
    };
  }

  @Get('clerk/me')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Retrieves the current user information based on the Clerk JWT token'
  })
  @ApiResponse({
    status: 200,
    description: 'Current user retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        clerkId: { type: 'string' },
        wallet: { type: 'object' },
        emergencyContacts: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid Clerk token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCurrentUser(@ClerkUser() clerkId: string): Promise<User | null> {
    return this.usersService.getCurrentUser(clerkId);
  }

  @Put('clerk/me')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Update current authenticated user',
    description: 'Updates the current user profile information based on the Clerk JWT token'
  })
  @ApiBody({ type: UpdateUserClerkDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        clerkId: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid Clerk token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCurrentUser(
    @ClerkUser() clerkId: string,
    @Body() updateUserClerkDto: UpdateUserClerkDto,
  ): Promise<User> {
    return this.usersService.updateCurrentUser(clerkId, updateUserClerkDto);
  }

  @Get('clerk/me/rides')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Get current user rides',
    description: 'Retrieves all rides for the current authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User rides retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid Clerk token' })
  async getMyRides(@ClerkUser() clerkId: string): Promise<any[]> {
    const user = await this.usersService.findUserByClerkId(clerkId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.usersService.getUserRides(user.id);
  }

  @Get('clerk/me/orders')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Get current user delivery orders',
    description: 'Retrieves all delivery orders for the current authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid Clerk token' })
  async getMyDeliveryOrders(@ClerkUser() clerkId: string): Promise<any[]> {
    return this.usersService.getUserDeliveryOrders(clerkId);
  }

  // ===============================
  // DEBUG ENDPOINTS (REMOVER EN PRODUCCIÓN)
  // ===============================

  @Get('debug/env')
  @ApiOperation({
    summary: 'Debug environment variables',
    description: 'Shows the status of environment variables (REMOVE IN PRODUCTION)'
  })
  @ApiResponse({
    status: 200,
    description: 'Environment variables status',
  })
  async debugEnvironment(): Promise<any> {
    const clerkService = this.usersService['clerkService'];
    const configService = clerkService['configService'];

    return {
      clerk: {
        secretKey: configService.clerk.secretKey ? 'CONFIGURADO' : 'NO CONFIGURADO',
        publishableKey: configService.clerk.publishableKey ? 'CONFIGURADO' : 'NO CONFIGURADO',
        jwtPublicKey: configService.clerk.jwtPublicKey ? 'CONFIGURADO' : 'NO CONFIGURADO',
        isConfigured: configService.clerk.isConfigured(),
        apiUrl: configService.clerk.apiUrl,
        frontendApi: configService.clerk.frontendApi,
        domain: configService.clerk.domain,
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('debug/token-generator')
  @ApiOperation({
    summary: 'Generate development test tokens',
    description: 'Generate JWT-like tokens for development testing (REMOVE IN PRODUCTION)'
  })
  @ApiResponse({
    status: 200,
    description: 'Generated test tokens',
  })
  async generateTestTokens(): Promise<any> {
    const tokens = [
      'dev-test-token',
      'dev-test-token-user1',
      'dev-test-token-user2',
      'dev-test-token-admin',
    ];

    return {
      message: 'Development test tokens',
      tokens: tokens,
      usage: 'Use any of these tokens in the Authorization header: Bearer <token>',
      example: {
        curl: 'curl -H "Authorization: Bearer dev-test-token" http://localhost:3000/api/user',
        swagger: 'Click "Authorize" button and enter: Bearer dev-test-token'
      },
      note: 'These tokens only work in development mode and are handled by ClerkAuthGuard'
    };
  }

  @Get('debug/clerk-test')
  @ApiOperation({
    summary: 'Test Clerk token validation',
    description: 'Test endpoint for Clerk token validation (REMOVE IN PRODUCTION)'
  })
  @ApiResponse({
    status: 200,
    description: 'Token validation result',
  })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async testClerkToken(@Query('token') token?: string): Promise<any> {
    if (!token) {
      return {
        error: 'No token provided',
        usage: 'Add ?token=YOUR_JWT_TOKEN to the URL',
        example: 'http://localhost:3000/api/user/debug/clerk-test?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...'
      };
    }

    const clerkService = this.usersService['clerkService'];

    try {
      const decoded = await clerkService.verifyToken(token);
      const userInfo = clerkService.getUserInfoFromToken(token);

      return {
        success: true,
        decoded,
        userInfo,
        clerkId: decoded.sub || decoded.userId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
