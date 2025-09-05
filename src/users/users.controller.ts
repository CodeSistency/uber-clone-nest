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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('users')
@Controller('api/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Register/Create a new user' })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration data'
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
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john@example.com' },
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
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ data: User[] }> {
    // Verificar si el usuario ya existe por email
    const existingUser = await this.usersService.findUserByEmail(createUserDto.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const user = await this.usersService.createUser({
      name: createUserDto.name,
      email: createUserDto.email,
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

  @Get('profile/:id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserProfileById(
    @Param('id') id: string,
  ): Promise<User | null> {
    return this.usersService.findUserByIdWithRelations(Number(id));
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

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get user delivery orders' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
  })
  async getUserDeliveryOrders(
    @Param('id') id: string,
  ): Promise<any[]> {
    return this.usersService.getUserDeliveryOrders(Number(id));
  }

  // =========================================
  // ENDPOINTS PARA JWT AUTHENTICATION
  // =========================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Retrieves the current user information based on the JWT token'
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
        phone: { type: 'string' },
        country: { type: 'string' },
        state: { type: 'string' },
        city: { type: 'string' },
        wallet: { type: 'object' },
        emergencyContacts: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCurrentUser(@GetUser() user: any): Promise<User | null> {
    return this.usersService.getCurrentUser(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update current authenticated user',
    description: 'Updates the current user profile information based on the JWT token'
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCurrentUser(
    @GetUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateCurrentUser(user.id, updateUserDto);
  }

  @Get('me/rides')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current user rides',
    description: 'Retrieves all rides for the current authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User rides retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  async getMyRides(@GetUser() user: any): Promise<any[]> {
    return this.usersService.getUserRides(user.id);
  }

  @Get('me/orders')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current user delivery orders',
    description: 'Retrieves all delivery orders for the current authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid JWT token' })
  async getMyDeliveryOrders(@GetUser() user: any): Promise<any[]> {
    return this.usersService.getUserDeliveryOrders(user.id);
  }

  // ===============================
  // DEBUG ENDPOINTS (REMOVER EN PRODUCCIÓN)
  // ===============================

  @Get('debug/token-generator')
  @ApiOperation({
    summary: 'Generate development test tokens',
    description: 'Generate JWT tokens for development testing (REMOVE IN PRODUCTION)'
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
      note: 'These tokens only work in development mode and are handled by JwtAuthGuard'
    };
  }
}
