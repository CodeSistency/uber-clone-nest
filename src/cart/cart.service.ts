import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AddCartItemDto {
  productId: number;
  quantity: number;
  notes?: string;
}

export interface RemoveCartItemDto {
  productId: number;
}

export interface UpdateCartItemDto {
  productId: number;
  quantity: number;
  notes?: string;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(userId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  store: true,
                },
              },
            },
          },
        },
      });
      this.logger.log(`Created new cart for user ${userId}`);
    }

    return cart;
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    this.logger.log(
      `Adding item to cart for user ${userId}: product ${dto.productId}, quantity ${dto.quantity}`,
    );

    // Verify product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isAvailable) {
      throw new NotFoundException('Product is not available');
    }

    if (product.stock < dto.quantity) {
      throw new NotFoundException('Insufficient stock');
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.productId === dto.productId,
    );

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          notes: dto.notes || existingItem.notes,
        },
      });
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          notes: dto.notes,
        },
      });
    }

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: number, dto: RemoveCartItemDto) {
    this.logger.log(
      `Removing item from cart for user ${userId}: product ${dto.productId}`,
    );

    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((item) => item.productId === dto.productId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    await this.prisma.cartItem.delete({
      where: { id: item.id },
    });

    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: number, dto: UpdateCartItemDto) {
    this.logger.log(
      `Updating cart item for user ${userId}: product ${dto.productId}, quantity ${dto.quantity}`,
    );

    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((item) => item.productId === dto.productId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    // Verify stock availability
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || product.stock < dto.quantity) {
      throw new NotFoundException('Insufficient stock');
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: dto.quantity,
        notes: dto.notes,
      },
    });

    return this.getOrCreateCart(userId);
  }

  async getCartSummary(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    const summary = {
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.imageUrl,
        storeId: item.product.storeId,
        storeName: item.product.store.name,
        price: Number(item.product.price),
        quantity: item.quantity,
        notes: item.notes,
        subtotal: Number(item.product.price) * item.quantity,
      })),
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      ),
      stores: [...new Set(cart.items.map((item) => item.product.storeId))],
    };

    return summary;
  }

  async clearCart(userId: number) {
    this.logger.log(`Clearing cart for user ${userId}`);

    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getOrCreateCart(userId);
  }

  async getCartItemCount(userId: number): Promise<number> {
    const cart = await this.getOrCreateCart(userId);
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  async validateCartForOrder(
    userId: number,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const cart = await this.getOrCreateCart(userId);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    // Check stock availability
    for (const item of cart.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        errors.push(`Product ${item.productId} no longer exists`);
      } else if (!product.isAvailable) {
        errors.push(`Product ${product.name} is no longer available`);
      } else if (product.stock < item.quantity) {
        errors.push(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async convertCartToOrder(userId: number, orderData: any) {
    const cart = await this.getOrCreateCart(userId);

    // Validate cart
    const validation = await this.validateCartForOrder(userId);
    if (!validation.valid) {
      throw new Error(
        `Cart validation failed: ${validation.errors.join(', ')}`,
      );
    }

    // Create delivery order with cart items
    const order = await this.prisma.deliveryOrder.create({
      data: {
        userId,
        storeId: cart.items[0]?.product.storeId || 1, // Use first store (could be enhanced for multi-store)
        deliveryAddress: orderData.deliveryAddress,
        deliveryLatitude: orderData.deliveryLatitude,
        deliveryLongitude: orderData.deliveryLongitude,
        totalPrice: cart.items.reduce(
          (sum, item) => sum + Number(item.product.price) * item.quantity,
          0,
        ),
        deliveryFee: orderData.deliveryFee || 5.0,
        status: 'pending',
      },
    });

    // Create order items from cart
    for (const item of cart.items) {
      await this.prisma.orderItem.create({
        data: {
          orderId: order.orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        },
      });
    }

    // Clear cart after successful order creation
    await this.clearCart(userId);

    return order;
  }
}
