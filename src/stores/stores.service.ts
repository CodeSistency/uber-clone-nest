import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Store, Product, Prisma } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface GetNearbyStoresQuery {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  limit?: number;
}

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async getNearbyStores(query: GetNearbyStoresQuery): Promise<Store[]> {
    const { lat, lng, radius = 5, category, limit = 50 } = query;

    // Calcular bounding box para búsqueda eficiente
    const earthRadius = 6371; // km
    const latDelta = (radius / earthRadius) * (180 / Math.PI);
    const lngDelta = (radius / earthRadius) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    return this.prisma.store.findMany({
      where: {
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
        isOpen: true,
        ...(category && { category }),
      },
      include: {
        _count: {
          select: { products: true, deliveryOrders: true }
        },
        products: {
          where: { isAvailable: true },
          take: 3, // Preview de productos
          orderBy: { price: 'asc' }
        },
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });
  }

  async getStoreDetails(storeId: number): Promise<Store> {
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
            deliveryOrders: true
          }
        }
      },
    });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return store;
  }

  async getStoreProducts(storeId: number, category?: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        storeId,
        isAvailable: true,
        ...(category && { category }),
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
    });
  }

  async createStore(createStoreDto: CreateStoreDto, ownerClerkId: string): Promise<Store> {
    return this.prisma.store.create({
      data: {
        ...createStoreDto,
        ownerClerkId,
      },
    });
  }

  async updateStore(storeId: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: updateStoreDto,
    });
  }

  async deleteStore(storeId: number): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return this.prisma.store.delete({
      where: { id: storeId },
    });
  }

  async addProduct(storeId: number, createProductDto: CreateProductDto): Promise<Product> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        storeId,
      },
    });
  }

  async updateProduct(productId: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: updateProductDto,
    });
  }

  async deleteProduct(productId: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async isStoreOwner(storeId: number, userClerkId: string): Promise<boolean> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerClerkId: true },
    });

    return store?.ownerClerkId === userClerkId;
  }

  async getStoreById(storeId: number): Promise<Store | null> {
    return this.prisma.store.findUnique({
      where: { id: storeId },
    });
  }

  async getStoresByOwner(ownerClerkId: string): Promise<Store[]> {
    return this.prisma.store.findMany({
      where: { ownerClerkId },
      include: {
        _count: {
          select: {
            products: true,
            deliveryOrders: true
          }
        }
      },
    });
  }

  async updateStoreRating(storeId: number): Promise<void> {
    const ratings = await this.prisma.rating.findMany({
      where: { storeId },
      select: { ratingValue: true },
    });

    if (ratings.length === 0) {
      return;
    }

    const averageRating = ratings.reduce((sum, rating) => sum + rating.ratingValue, 0) / ratings.length;

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        rating: Math.round(averageRating * 100) / 100, // Redondear a 2 decimales
      },
    });
  }

  async searchStores(query: string, lat?: number, lng?: number, radius: number = 10): Promise<Store[]> {
    let whereClause: Prisma.StoreWhereInput = {
      isOpen: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { cuisineType: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Agregar filtro geográfico si se proporcionan coordenadas
    if (lat !== undefined && lng !== undefined) {
      const earthRadius = 6371; // km
      const latDelta = (radius / earthRadius) * (180 / Math.PI);
      const lngDelta = (radius / earthRadius) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);

      whereClause = {
        ...whereClause,
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
      };
    }

    return this.prisma.store.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { products: true }
        },
        products: {
          where: { isAvailable: true },
          take: 2,
        },
      },
      orderBy: { rating: 'desc' },
      take: 20,
    });
  }
}
