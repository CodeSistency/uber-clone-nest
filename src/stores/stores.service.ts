import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetNearbyStoresDto } from './dto/get-nearby-stores.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async getNearbyStores(query: GetNearbyStoresDto) {
    const { lat, lng, radius = 5, category, search } = query;

    let whereClause: any = {
      isOpen: true,
    };

    // Add category filter
    if (category) {
      whereClause.category = category;
    }

    // Add search filter
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Add location filter if coordinates provided
    if (lat && lng) {
      // Using PostGIS ST_DWithin for distance calculation
      whereClause = {
        ...whereClause,
        AND: [
          {
            latitude: {
              gte: lat - (radius / 111.32), // Rough conversion km to degrees
              lte: lat + (radius / 111.32),
            },
          },
          {
            longitude: {
              gte: lng - (radius / (111.32 * Math.cos(lat * Math.PI / 180))),
              lte: lng + (radius / (111.32 * Math.cos(lat * Math.PI / 180))),
            },
          },
        ],
      };
    }

    const stores = await this.prisma.store.findMany({
      where: whereClause,
      include: {
        products: {
          where: { isAvailable: true },
          take: 5, // Limit products for performance
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    return stores;
  }

  async getStoreWithProducts(storeId: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { category: 'asc' },
        },
        ratings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            products: true,
            ratings: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async createStore(createStoreDto: CreateStoreDto, ownerId: number) {
    const store = await this.prisma.store.create({
      data: {
        ...createStoreDto,
        ownerId,
      },
      include: {
        products: true,
      },
    });

    return store;
  }

  async addProduct(storeId: number, createProductDto: CreateProductDto, ownerId: number) {
    // Verify store ownership
    await this.isStoreOwner(storeId, ownerId);

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        storeId,
      },
    });

    return product;
  }

  async getStoresByOwner(ownerId: number) {
    const stores = await this.prisma.store.findMany({
      where: { ownerId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true,
          },
        },
        _count: {
          select: {
            products: true,
            deliveryOrders: true,
          },
        },
      },
    });

    return stores;
  }

  async isStoreOwner(storeId: number, userId: number): Promise<boolean> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    return true;
  }

  async updateStore(storeId: number, updateData: Partial<CreateStoreDto>, ownerId: number) {
    await this.isStoreOwner(storeId, ownerId);

    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: updateData,
    });

    return store;
  }

  async deleteStore(storeId: number, ownerId: number) {
    await this.isStoreOwner(storeId, ownerId);

    await this.prisma.store.delete({
      where: { id: storeId },
    });

    return { message: 'Store deleted successfully' };
  }

  async updateProduct(storeId: number, productId: number, updateData: Partial<CreateProductDto>, ownerId: number) {
    await this.isStoreOwner(storeId, ownerId);

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return product;
  }

  async deleteProduct(storeId: number, productId: number, ownerId: number) {
    await this.isStoreOwner(storeId, ownerId);

    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }
}