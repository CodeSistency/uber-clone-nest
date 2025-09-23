import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { Prisma, Store } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AdminCreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';

type StoreStatus = 'active' | 'inactive' | 'all';

// Helper type to convert Decimal fields to number
type DecimalToNumber<T> = {
  [K in keyof T]: T[K] extends Prisma.Decimal 
    ? number 
    : T[K] extends object 
      ? DecimalToNumber<T[K]>
      : T[K];
};

// Base store type with counts
type StoreWithCounts = Prisma.StoreGetPayload<{
  include: {
    _count: {
      select: {
        products: true;
        deliveryOrders: true;
      };
    };
  };
}>;

// Extended Store type with computed statistics
type StoreWithStats = DecimalToNumber<Omit<StoreWithCounts, 'rating'>> & {
  // Additional computed fields
  rating: number;
  totalRatings: number;
  menuItems: number;
  orders: number;
  revenue: number;
};

@Injectable()
export class StoreManagementService {
  private readonly logger = new Logger(StoreManagementService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Safely converts a Prisma Decimal to a number
   * @param value The value to convert (can be Decimal, string, number, or null/undefined)
   * @returns The converted number or 0 if the value is null/undefined
   */
  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (value && typeof value.toString === 'function') return parseFloat(value.toString()) || 0;
    return 0;
  }

  /**
   * Get a paginated list of stores with filters
   * @param options Pagination and filtering options
   * @returns List of stores and pagination info
   */
  async getStores(options: { page: number; limit: number; search?: string; status?: StoreStatus; category?: string }) {
    const { page, limit, search, status, category } = options;
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const where: Prisma.StoreWhereInput = {};

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply status filter
    if (status && status !== 'all') {
      where.isOpen = status === 'active';
    }

    // Apply category filter
    if (category) {
      where.category = category;
    }

    try {
      const [stores, total] = await Promise.all([
        // Get paginated stores with related data
        this.prisma.store.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                products: true,
                deliveryOrders: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }) as unknown as Promise<StoreWithStats[]>,
        
        // Count total stores matching filters
        this.prisma.store.count({ where }),
      ]);

      // Calculate statistics for each store
      const storesWithStats = await Promise.all(
        stores.map(async (store) => {
          const [ratingAgg, revenueAgg, menuItemsCount, ordersCount] = await Promise.all([
            this.prisma.rating.aggregate({
              where: { storeId: store.id },
              _avg: { ratingValue: true },
              _count: true,
            }),
            this.prisma.deliveryOrder.aggregate({
              where: { 
                storeId: store.id, 
                status: 'DELIVERED' 
              },
              _sum: { totalPrice: true },
            }),
            this.prisma.product.count({ where: { storeId: store.id } }),
            this.prisma.deliveryOrder.count({ where: { storeId: store.id } })
          ]);

          // Create a new object with the correct types
          const storeWithStats: StoreWithStats = {
            ...store,
            _count: {
              products: store._count?.products || 0,
              deliveryOrders: store._count?.deliveryOrders || 0,
            },
            rating: this.toNumber(ratingAgg._avg.ratingValue),
            totalRatings: ratingAgg._count || 0,
            revenue: this.toNumber(revenueAgg._sum.totalPrice),
            menuItems: menuItemsCount,
            orders: ordersCount,
            latitude: this.toNumber(store.latitude),
            longitude: this.toNumber(store.longitude),
          };

          return storeWithStats;
        }),
      );

      return {
        success: true,
        data: storesWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching stores:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific store
   * @param id Store ID
   * @returns Detailed store information
   */
  async getStoreById(id: number) {
    try {
      const store = await this.prisma.store.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
              deliveryOrders: true,
            },
          },
        },
      });

      if (!store) {
        throw new NotFoundException(`Store with ID ${id} not found`);
      }

      // Calculate statistics
      const [ratingAgg, revenueAgg] = await Promise.all([
        this.prisma.rating.aggregate({
          where: { storeId: id },
          _avg: { ratingValue: true },
          _count: true,
        }),
        this.prisma.deliveryOrder.aggregate({
          where: { 
            storeId: id, 
            status: 'DELIVERED' 
          },
          _sum: { totalPrice: true },
        })
      ]);

      // Get product and order counts
      const productCount = await this.prisma.product.count({ 
        where: { storeId: id } 
      });

      const orderCount = await this.prisma.deliveryOrder.count({ 
        where: { storeId: id } 
      });

      // Transform the data for the response
      return {
        ...store,
        rating: this.toNumber(ratingAgg._avg.ratingValue),
        totalRatings: ratingAgg._count || 0,
        menuItems: productCount,
        orders: orderCount,
        revenue: this.toNumber(revenueAgg._sum.totalPrice),
        latitude: this.toNumber(store.latitude),
        longitude: this.toNumber(store.longitude)
      } as StoreWithStats;
    } catch (error) {
      this.logger.error(`Error fetching store ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new store
   * @param createStoreDto Store data
   * @returns Created store
   */
  async createStore(createStoreDto: AdminCreateStoreDto) {
    try {
      // Only include fields that exist in the Prisma schema
      const storeData: Prisma.StoreCreateInput = {
        name: createStoreDto.name,
        address: createStoreDto.address,
        latitude: new Prisma.Decimal(createStoreDto.latitude || 0),
        longitude: new Prisma.Decimal(createStoreDto.longitude || 0),
        // Add other fields that exist in the schema here
      };

      // Create the store with all necessary fields
      const store = await this.prisma.store.create({
        data: storeData,
        include: {
          _count: {
            select: {
              products: true,
              deliveryOrders: true,
            },
          },
        },
      });

      this.logger.log(`Created new store with ID: ${store.id}`);

      // Create a new store with stats that matches the StoreWithStats type
      const storeWithStats: StoreWithStats = {
        ...store,
        _count: {
          products: 0, // New store has no products yet
          deliveryOrders: 0, // New store has no orders yet
        },
        rating: 0, // New store has no ratings yet
        totalRatings: 0,
        revenue: 0, // New store has no revenue yet
        menuItems: 0, // New store has no menu items yet
        orders: 0, // New store has no orders yet
        latitude: this.toNumber(store.latitude),
        longitude: this.toNumber(store.longitude),
      };

      return {
        success: true,
        message: 'Store created successfully',
        data: storeWithStats,
      };
    } catch (error) {
      this.logger.error('Error creating store:', error);
      throw new InternalServerErrorException('Failed to create store');
    }
  }

  /**
   * Update an existing store
   * @param id Store ID
   * @param updateStoreDto Updated store data
   * @returns Updated store
   */
  async updateStore(id: number, updateStoreDto: UpdateStoreDto) {
    this.logger.log(`Updating store with ID: ${id}`);

    // Check if store exists
    const existingStore = await this.prisma.store.findUnique({ where: { id } });
    if (!existingStore) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    // Prepare update data based on DTO
    const updateData: Prisma.StoreUpdateInput = {};
    
    // Only include fields that are provided in the DTO and exist in the Prisma schema
    if (updateStoreDto.name !== undefined) updateData.name = updateStoreDto.name;
    if (updateStoreDto.address !== undefined) updateData.address = updateStoreDto.address;
    if (updateStoreDto.latitude !== undefined) updateData.latitude = new Prisma.Decimal(updateStoreDto.latitude);
    if (updateStoreDto.longitude !== undefined) updateData.longitude = new Prisma.Decimal(updateStoreDto.longitude);
    
    // Only include fields that exist in the Prisma schema
    // The following fields are known to exist: name, address, latitude, longitude
    // Other fields will be ignored as they don't exist in the schema

    try {
      // Update the store with only valid fields
      const updatedStore = await this.prisma.store.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              products: true,
              deliveryOrders: true,
            },
          },
        },
      });

      // Get rating statistics
      const ratingAgg = await this.prisma.rating.aggregate({
        where: { storeId: id },
        _avg: { ratingValue: true },
        _count: true,
      });

      // Get revenue statistics
      const revenueAgg = await this.prisma.deliveryOrder.aggregate({
        where: { 
          storeId: id,
          status: 'DELIVERED'
        },
        _sum: { totalPrice: true },
      });

      // Get product and order counts
      const [productCount, orderCount] = await Promise.all([
        this.prisma.product.count({ where: { storeId: id } }),
        this.prisma.deliveryOrder.count({ where: { storeId: id } })
      ]);

      // Format the response with statistics
      const storeWithStats: StoreWithStats = {
        ...updatedStore,
        _count: {
          products: updatedStore._count?.products || 0,
          deliveryOrders: updatedStore._count?.deliveryOrders || 0
        },
        rating: this.toNumber(ratingAgg._avg.ratingValue),
        totalRatings: ratingAgg._count || 0,
        revenue: this.toNumber(revenueAgg._sum.totalPrice),
        menuItems: productCount,
        orders: orderCount,
        latitude: this.toNumber(updatedStore.latitude),
        longitude: this.toNumber(updatedStore.longitude)
      };

      return {
        success: true,
        data: storeWithStats,
      };
    } catch (error) {
      this.logger.error(`Error updating store: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update store');
    }
  }
  
  /**
   * Delete a store (hard delete)
   * @param id Store ID
   */
  async deleteStore(id: number) {
    // Check if the store exists
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    try {
      // Perform delete operation (hard delete since we don't have soft delete)
      await this.prisma.store.delete({
        where: { id },
      });

      this.logger.log(`Deleted store with ID: ${id}`);
      return { success: true, message: 'Store deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting store: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete store');
    }
  }

  /**
   * Update store status (active/inactive)
   * @param id Store ID
   * @param isActive New status
   * @returns Updated store
   */
  async updateStoreStatus(id: number, isActive: boolean) {
    // Check if the store exists
    const store = await this.prisma.store.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            deliveryOrders: true,
          },
        },
      },
    });
    
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    try {
      // Update the store's isOpen status and fetch all necessary data
      const [updatedStore, ratingAgg, revenueAgg, productCount, orderCount] = await Promise.all([
        this.prisma.store.update({
          where: { id },
          data: { isOpen: isActive },
          include: {
            _count: {
              select: {
                products: true,
                deliveryOrders: true,
              },
            },
          },
        }),
        this.prisma.rating.aggregate({
          where: { storeId: id },
          _avg: { ratingValue: true },
          _count: true,
        }),
        this.prisma.deliveryOrder.aggregate({
          where: { 
            storeId: id,
            status: 'DELIVERED'
          },
          _sum: { totalPrice: true },
        }),
        this.prisma.product.count({ where: { storeId: id } }),
        this.prisma.deliveryOrder.count({ where: { storeId: id } })
      ]);

      // Create a properly typed response
      const storeWithStats: StoreWithStats = {
        ...updatedStore,
        _count: {
          products: updatedStore._count?.products || 0,
          deliveryOrders: updatedStore._count?.deliveryOrders || 0,
        },
        rating: this.toNumber(ratingAgg._avg.ratingValue),
        totalRatings: ratingAgg._count || 0,
        revenue: this.toNumber(revenueAgg._sum.totalPrice),
        menuItems: productCount,
        orders: orderCount,
        latitude: this.toNumber(updatedStore.latitude),
        longitude: this.toNumber(updatedStore.longitude),
      };

      this.logger.log(`Updated status for store ${id} to ${isActive ? 'active' : 'inactive'}`);

      return {
        success: true,
        message: `Store ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: storeWithStats,
      };
    } catch (error) {
      this.logger.error(`Error updating status for store ${id}:`, error);
      throw new InternalServerErrorException('Failed to update store status');
    }
  }
}