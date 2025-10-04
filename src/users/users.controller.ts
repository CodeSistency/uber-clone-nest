import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
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
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
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
    description: 'User registration data',
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
  @ApiResponse({
    status: 400,
    description: 'Missing required fields or invalid data',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists with this email',
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ data: User[] }> {
    // Verificar si el usuario ya existe por email
    const existingUser = await this.usersService.findUserByEmail(
      createUserDto.email,
    );
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
  async findUserProfileById(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findUserByIdWithRelations(Number(id));
  }

  @Get()
  @ApiOperation({
    summary: 'Buscar usuarios con filtros avanzados y paginación',
    description: `
    Endpoint flexible para buscar usuarios con múltiples filtros y paginación.
    Si no se proporcionan parámetros de búsqueda, devuelve todos los usuarios paginados.

    Filtros disponibles:
    - name: Búsqueda parcial por nombre
    - email: Búsqueda parcial por email
    - phone: Búsqueda por teléfono
    - city/state/country: Filtros por ubicación
    - userType: 'user' o 'admin'
    - adminRole: roles de administrador
    - isActive: estado activo/inactivo
    - emailVerified/phoneVerified/identityVerified: estados de verificación
    - gender: género del usuario
    - preferredLanguage: idioma preferido
    - createdFrom/createdTo: rango de fechas de creación
    - lastLoginFrom/lastLoginTo: rango de fechas de último login
    - sortBy/sortOrder: ordenamiento personalizado
    - page/limit: paginación
    `,
  })
  @ApiQuery({
    type: SearchUsersDto,
    description: 'Parámetros de búsqueda y paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuarios encontrados exitosamente',
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
              phone: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              isActive: { type: 'boolean' },
              userType: { type: 'string' },
              adminRole: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              wallet: {
                type: 'object',
                properties: {
                  balance: { type: 'number' },
                },
              },
              _count: {
                type: 'object',
                properties: {
                  rides: { type: 'number' },
                  deliveryOrders: { type: 'number' },
                  ratings: { type: 'number' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
        filters: {
          type: 'object',
          properties: {
            applied: {
              type: 'array',
              items: { type: 'string' },
            },
            searchTerm: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parámetros de búsqueda inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async searchUsers(
    @Query() searchDto: SearchUsersDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.searchUsers(searchDto);
  }

  @Get('email/:email')
  @ApiOperation({
    summary: 'Buscar usuario específico por email',
    description:
      'Busca un usuario específico por su dirección de email completa',
  })
  @ApiParam({
    name: 'email',
    description: 'Dirección de email del usuario',
    example: 'usuario@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        isActive: { type: 'boolean' },
        userType: { type: 'string' },
        adminRole: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findUserByEmail(@Param('email') email: string): Promise<any> {
    return this.usersService.findUserByEmail(email);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update user information',
    description:
      'Update user profile information. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '1',
    type: Number,
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User fields to update',
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
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async updateUser(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
  ): Promise<User> {
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
  async getUserDeliveryOrders(@Param('id') id: string): Promise<any[]> {
    return this.usersService.getUserDeliveryOrders(Number(id));
  }

  // =========================================
  // ENDPOINTS PARA JWT AUTHENTICATION
  // =========================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current authenticated user',
    description:
      'Retrieves the current user information based on the JWT token',
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
    description:
      'Updates the current user profile information based on the JWT token',
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

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update current user profile (PATCH)',
    description: `
    Updates the current authenticated user's profile information using PATCH method.
    Only provided fields will be updated. This endpoint is specifically designed for
    profile updates with comprehensive validation and sanitization.
    
    **Features:**
    - Partial updates (only send fields you want to change)
    - Comprehensive validation with detailed error messages
    - Data sanitization (trimming, case normalization)
    - Email uniqueness validation
    - Phone number format validation
    - URL validation for profile images
    - Length constraints for all text fields
    
    **Validation Rules:**
    - Name: 2-100 characters
    - Email: Valid email format, will be converted to lowercase
    - Phone: International format (+countrycode + number)
    - Date of Birth: Valid date in YYYY-MM-DD format
    - Gender: Must be one of: male, female, other, prefer_not_to_say
    - Profile Image: Valid URL format
    - Address: Max 255 characters
    - City/State/Country: Max 100 characters each
    - Postal Code: Max 20 characters
    - Preferred Language: es, en, pt, fr
    - Timezone: Max 50 characters
    - Currency: USD, EUR, VES, COP, BRL
    `,
  })
  @ApiBody({
    type: UpdateUserProfileDto,
    description: 'User profile fields to update (partial update)',
    examples: {
      basic: {
        summary: 'Basic profile update',
        value: {
          name: 'Juan Carlos Pérez',
          phone: '+584141234567',
          city: 'Caracas',
          country: 'Venezuela',
        },
      },
      complete: {
        summary: 'Complete profile update',
        value: {
          name: 'María González',
          email: 'maria.gonzalez@example.com',
          phone: '+584141234567',
          dateOfBirth: '1985-03-15',
          gender: 'female',
          profileImage: 'https://example.com/profile.jpg',
          address: 'Calle 123, Edificio ABC, Apartamento 4B',
          city: 'Caracas',
          state: 'Miranda',
          country: 'Venezuela',
          postalCode: '1010',
          preferredLanguage: 'es',
          timezone: 'America/Caracas',
          currency: 'USD',
        },
      },
      minimal: {
        summary: 'Minimal update',
        value: {
          city: 'Valencia',
          state: 'Carabobo',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Juan Carlos Pérez' },
        email: { type: 'string', example: 'juan.perez@example.com' },
        phone: { type: 'string', example: '+584141234567' },
        dateOfBirth: { type: 'string', format: 'date', example: '1990-05-15' },
        gender: { type: 'string', example: 'male' },
        profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
        address: { type: 'string', example: 'Calle 123, Centro' },
        city: { type: 'string', example: 'Caracas' },
        state: { type: 'string', example: 'Miranda' },
        country: { type: 'string', example: 'Venezuela' },
        postalCode: { type: 'string', example: '1010' },
        preferredLanguage: { type: 'string', example: 'es' },
        timezone: { type: 'string', example: 'America/Caracas' },
        currency: { type: 'string', example: 'USD' },
        updatedAt: { type: 'string', format: 'date-time' },
        wallet: {
          type: 'object',
          properties: {
            balance: { type: 'number', example: 150.50 },
          },
        },
        emergencyContacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              contactName: { type: 'string' },
              contactPhone: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Name must be at least 2 characters long',
            'Please provide a valid email address',
            'Phone number must be in international format (e.g., +584141234567)',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Token de autorización requerido' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async updateUserProfile(
    @GetUser() user: any,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ): Promise<User> {
    try {
      return await this.usersService.updateUserProfile(user.id, updateProfileDto);
    } catch (error) {
      if (error.message === 'User not found') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Email already exists') {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me/rides')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current user rides',
    description: 'Retrieves all rides for the current authenticated user',
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
    description:
      'Retrieves all delivery orders for the current authenticated user',
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
    description:
      'Generate JWT tokens for development testing (REMOVE IN PRODUCTION)',
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
      usage:
        'Use any of these tokens in the Authorization header: Bearer <token>',
      example: {
        curl: 'curl -H "Authorization: Bearer dev-test-token" http://localhost:3000/api/user',
        swagger: 'Click "Authorize" button and enter: Bearer dev-test-token',
      },
      note: 'These tokens only work in development mode and are handled by JwtAuthGuard',
    };
  }
}
