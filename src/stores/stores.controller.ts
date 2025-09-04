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
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreOwnerGuard } from './guards/store-owner.guard';

@ApiTags('Stores')
@ApiBearerAuth('JWT-auth')
@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ========== ENDPOINTS PARA CLIENTES ==========

  @Get()
  @ApiOperation({
    summary: 'Get nearby stores',
    description: 'Retrieve stores near the user location, optionally filtered by category'
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, description: 'User latitude' })
  @ApiQuery({ name: 'lng', required: true, type: Number, description: 'User longitude' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in km', example: 5 })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Store category filter' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results', example: 50 })
  @ApiResponse({ status: 200, description: 'Nearby stores retrieved successfully' })
  async getNearbyStores(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5,
    @Query('category') category?: string,
    @Query('limit') limit: number = 50,
  ) {
    const stores = await this.storesService.getNearbyStores({
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius),
      category,
      limit: Number(limit),
    });
    return { data: stores };
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search stores',
    description: 'Search stores by name, description, or category'
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'User latitude for location-based search' })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'User longitude for location-based search' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in km', example: 10 })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchStores(
    @Query('q') query: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radius') radius: number = 10,
  ) {
    const stores = await this.storesService.searchStores(
      query,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
      Number(radius),
    );
    return { data: stores };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get store details',
    description: 'Get detailed information about a store including products and ratings'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreDetails(@Param('id', ParseIntPipe) id: number) {
    const store = await this.storesService.getStoreDetails(id);
    return { data: store };
  }

  @Get(':id/products')
  @ApiOperation({
    summary: 'Get store products',
    description: 'Get all available products for a specific store'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Store ID' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Product category filter' })
  @ApiResponse({ status: 200, description: 'Store products retrieved successfully' })
  async getStoreProducts(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category?: string,
  ) {
    const products = await this.storesService.getStoreProducts(id, category);
    return { data: products };
  }

  // ========== ENDPOINTS PARA PROPIETARIOS DE TIENDA ==========

  @Post()
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({
    summary: 'Create new store',
    description: 'Create a new store (only for authenticated users)'
  })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createStore(@Body() createStoreDto: CreateStoreDto, @Req() req) {
    const store = await this.storesService.createStore(createStoreDto, req.user.clerkId);
    return {
      data: store,
      message: 'Store created successfully'
    };
  }

  @Put(':id')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({
    summary: 'Update store',
    description: 'Update store information (only for store owner)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this store' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    const store = await this.storesService.updateStore(id, updateStoreDto);
    return {
      data: store,
      message: 'Store updated successfully'
    };
  }

  @Delete(':id')
  @UseGuards(StoreOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete store',
    description: 'Delete a store (only for store owner)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Store ID' })
  @ApiResponse({ status: 204, description: 'Store deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this store' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async deleteStore(@Param('id', ParseIntPipe) id: number) {
    await this.storesService.deleteStore(id);
  }

  @Get('owner/my-stores')
  @ApiOperation({
    summary: 'Get my stores',
    description: 'Get all stores owned by the current user'
  })
  @ApiResponse({ status: 200, description: 'User stores retrieved successfully' })
  async getMyStores(@Req() req) {
    const stores = await this.storesService.getStoresByOwner(req.user.clerkId);
    return { data: stores };
  }

  // ========== GESTIÓN DE PRODUCTOS ==========

  @Post(':id/products')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({
    summary: 'Add product to store',
    description: 'Add a new product to a store (only for store owner)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Store ID' })
  @ApiResponse({ status: 201, description: 'Product added successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to manage this store' })
  async addProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() createProductDto: CreateProductDto,
  ) {
    const product = await this.storesService.addProduct(id, createProductDto);
    return {
      data: product,
      message: 'Product added successfully'
    };
  }

  @Put(':id/products/:productId')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({
    summary: 'Update product',
    description: 'Update product information (only for store owner)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Store ID' })
  @ApiParam({ name: 'productId', type: Number, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to manage this store' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const product = await this.storesService.updateProduct(productId, updateProductDto);
    return {
      data: product,
      message: 'Product updated successfully'
    };
  }

  @Delete(':id/products/:productId')
  @UseGuards(StoreOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete product',
    description: 'Delete a product from store (only for store owner)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Store ID' })
  @ApiParam({ name: 'productId', type: Number, description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to manage this store' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    await this.storesService.deleteProduct(productId);
  }
}
