import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../guards/admin-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { Permission } from '../../../entities/admin.entity';
import { StoreManagementService } from '../services/store-management.service';
import { AdminCreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';

type StoreStatus = 'active' | 'inactive' | 'all';
type StoreType =
  | 'restaurant'
  | 'grocery'
  | 'pharmacy'
  | 'convenience'
  | 'other'
  | 'all';

@Controller()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@ApiTags('admin/stores')
@ApiBearerAuth('JWT-auth')
export class StoreManagementController {
  private readonly logger = new Logger(StoreManagementController.name);

  constructor(private readonly storeService: StoreManagementService) {}

  @Get()
  @RequirePermissions(Permission.STORE_READ)
  @ApiOperation({
    summary: 'Get stores with filters',
    description:
      'Retrieve a paginated list of stores with advanced filtering options',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Number of stores per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search term for store name or description',
    example: 'pizza',
  })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'all'],
    required: false,
    description: 'Filter by store status',
    example: 'active',
  })
  @ApiQuery({
    name: 'type',
    enum: ['restaurant', 'grocery', 'pharmacy', 'convenience', 'other', 'all'],
    required: false,
    description: 'Filter by store type',
    example: 'restaurant',
  })
  @ApiResponse({
    status: 200,
    description: 'Stores retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Pizza Palace' },
              description: { type: 'string', example: 'Best pizza in town' },
              logo: { type: 'string', example: 'https://example.com/logo.jpg' },
              banner: {
                type: 'string',
                example: 'https://example.com/banner.jpg',
              },
              type: { type: 'string', example: 'restaurant' },
              address: { type: 'string', example: '123 Main St, City' },
              latitude: { type: 'number', example: 40.7128 },
              longitude: { type: 'number', example: -74.006 },
              phone: { type: 'string', example: '+1234567890' },
              email: { type: 'string', example: 'info@pizzapalace.com' },
              openingHours: {
                type: 'string',
                example: 'Mon-Fri: 9:00 AM - 10:00 PM',
              },
              isActive: { type: 'boolean', example: true },
              rating: { type: 'number', example: 4.5 },
              deliveryFee: { type: 'number', example: 2.5 },
              minOrderAmount: { type: 'number', example: 10 },
              estimatedDeliveryTime: { type: 'number', example: 30 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 50 },
            pages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getStores(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: StoreStatus,
    @Query('category') category?: string,
  ) {
    this.logger.log(
      `Fetching stores - page: ${page}, limit: ${limit}, search: ${search}, status: ${status}, category: ${category}`,
    );
    return this.storeService.getStores({
      page,
      limit,
      search,
      status,
      category,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.STORE_READ)
  @ApiOperation({
    summary: 'Get store by ID',
    description: 'Retrieve detailed information about a specific store',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Store ID to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Store details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Pizza Palace' },
        description: { type: 'string', example: 'Best pizza in town' },
        logo: { type: 'string', example: 'https://example.com/logo.jpg' },
        banner: { type: 'string', example: 'https://example.com/banner.jpg' },
        type: { type: 'string', example: 'restaurant' },
        address: { type: 'string', example: '123 Main St, City' },
        latitude: { type: 'number', example: 40.7128 },
        longitude: { type: 'number', example: -74.006 },
        phone: { type: 'string', example: '+1234567890' },
        email: { type: 'string', example: 'info@pizzapalace.com' },
        website: { type: 'string', example: 'https://pizzapalace.com' },
        openingHours: {
          type: 'string',
          example: 'Mon-Fri: 9:00 AM - 10:00 PM',
        },
        isActive: { type: 'boolean', example: true },
        rating: { type: 'number', example: 4.5 },
        totalRatings: { type: 'number', example: 125 },
        deliveryFee: { type: 'number', example: 2.5 },
        minOrderAmount: { type: 'number', example: 10 },
        estimatedDeliveryTime: { type: 'number', example: 30 },
        isFeatured: { type: 'boolean', example: true },
        isOpen: { type: 'boolean', example: true },
        commissionRate: { type: 'number', example: 15 },
        taxRate: { type: 'number', example: 8.875 },
        ownerName: { type: 'string', example: 'John Doe' },
        ownerEmail: { type: 'string', example: 'john@example.com' },
        ownerPhone: { type: 'string', example: '+1987654321' },
        bankAccountNumber: { type: 'string', example: '******1234' },
        bankName: { type: 'string', example: 'Chase Bank' },
        bankAccountHolder: { type: 'string', example: 'John Doe' },
        bankRoutingNumber: { type: 'string', example: '*****6789' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Pizza' },
              description: { type: 'string', example: 'Delicious pizzas' },
              image: {
                type: 'string',
                example: 'https://example.com/pizza.jpg',
              },
              isActive: { type: 'boolean', example: true },
              items: { type: 'number', example: 12 },
            },
          },
        },
        menuItems: { type: 'number', example: 45 },
        orders: { type: 'number', example: 256 },
        revenue: { type: 'number', example: 12500.75 },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async getStoreById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching store by ID: ${id}`);
    return this.storeService.getStoreById(id);
  }

  @Post()
  @RequirePermissions(Permission.STORE_WRITE)
  @ApiOperation({
    summary: 'Create a new store',
    description: 'Create a new store with the provided details',
  })
  @ApiCreatedResponse({
    description: 'Store created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Store created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Pizza Palace' },
            email: { type: 'string', example: 'info@pizzapalace.com' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async createStore(@Body() createStoreDto: AdminCreateStoreDto) {
    this.logger.log('Creating a new store');
    return this.storeService.createStore(createStoreDto);
  }

  @Put(':id')
  @RequirePermissions(Permission.STORE_WRITE)
  @ApiOperation({
    summary: 'Update a store',
    description: 'Update an existing store with the provided details',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Store ID to update',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Store updated successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Pizza Palace Updated' },
            isActive: { type: 'boolean', example: true },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    this.logger.log(`Updating store with ID: ${id}`);
    return this.storeService.updateStore(id, updateStoreDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.STORE_WRITE)
  @ApiOperation({
    summary: 'Delete a store',
    description: 'Delete a store by ID (soft delete)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Store ID to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Store deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Store deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async deleteStore(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Deleting store with ID: ${id}`);
    return this.storeService.deleteStore(id);
  }

  @Put(':id/status')
  @RequirePermissions(Permission.STORE_WRITE)
  @ApiOperation({
    summary: 'Update store status',
    description: 'Update the active status of a store',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Store ID to update status',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Store status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Store status updated successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            isActive: { type: 'boolean', example: false },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  async updateStoreStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    this.logger.log(
      `Updating status for store ID: ${id}, isActive: ${isActive}`,
    );
    return this.storeService.updateStoreStatus(id, isActive);
  }
}
