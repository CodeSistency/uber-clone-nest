import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';

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
              clerk_id: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<{ data: User[] }> {
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
  async findUserByClerkId(@Param('clerkId') clerkId: string): Promise<User | null> {
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
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() data: any): Promise<User> {
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
  @ApiResponse({ status: 200, description: 'User rides retrieved successfully' })
  async getUserRides(@Param('clerkId') clerkId: string): Promise<any[]> {
    return this.usersService.getUserRides(clerkId);
  }

  @Get(':clerkId/orders')
  @ApiOperation({ summary: 'Get user delivery orders' })
  @ApiParam({ name: 'clerkId', description: 'Clerk user ID' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  async getUserDeliveryOrders(@Param('clerkId') clerkId: string): Promise<any[]> {
    return this.usersService.getUserDeliveryOrders(clerkId);
  }
}
