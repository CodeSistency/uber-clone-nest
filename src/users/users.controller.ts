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
import { CreateUserClerkDto } from './dto/create-user-clerk.dto';
import { UpdateUserClerkDto } from './dto/update-user-clerk.dto';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkUser } from './decorators/clerk-user.decorator';

@ApiTags('users')
@Controller('api/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user record' })
  @ApiBody({ type: CreateUserDto })
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
              clerk_id: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ data: User[] }> {
    const user = await this.usersService.createUser(createUserDto);
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

  @Get(':clerkId/rides')
  @ApiOperation({ summary: 'Get user rides' })
  @ApiParam({ name: 'clerkId', description: 'Clerk user ID' })
  @ApiResponse({
    status: 200,
    description: 'User rides retrieved successfully',
  })
  async getUserRides(@Param('clerkId') clerkId: string): Promise<any[]> {
    return this.usersService.getUserRides(clerkId);
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

  @Post('clerk/register')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Register/Create user with Clerk authentication',
    description: 'Creates a new user record using Clerk authentication. Clerk ID is automatically extracted from the JWT token.'
  })
  @ApiBody({ type: CreateUserClerkDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully with Clerk authentication',
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
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing required fields or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid Clerk token' })
  @ApiResponse({ status: 409, description: 'User already exists with this Clerk ID' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async registerWithClerk(
    @ClerkUser() clerkId: string,
    @Body() createUserClerkDto: CreateUserClerkDto,
  ): Promise<{ data: User[] }> {
    // Verificar si el usuario ya existe
    const existingUser = await this.usersService.userExistsByClerkId(clerkId);
    if (existingUser) {
      throw new Error('User already exists with this Clerk ID');
    }

    const user = await this.usersService.createUserWithClerk(clerkId, {
      name: createUserClerkDto.name,
      email: createUserClerkDto.email,
    });
    return { data: [user] };
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
    return this.usersService.getUserRides(clerkId);
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
