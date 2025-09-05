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
  ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetNearbyStoresDto } from './dto/get-nearby-stores.dto';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: 'Get nearby stores',
    description: 'Retrieve stores near user location with optional filters'
  })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns nearby stores with products'
  })
  async getNearbyStores(@Query() query: GetNearbyStoresDto) {
    return this.storesService.getNearbyStores(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get store details',
    description: 'Get detailed information about a specific store including products'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns store with products and ratings'
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found'
  })
  async getStoreDetails(@Param('id', ParseIntPipe) storeId: number) {
    return this.storesService.getStoreWithProducts(storeId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new store',
    description: 'Create a new store for the authenticated user'
  })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully'
  })
  async createStore(
    @Body() createStoreDto: CreateStoreDto,
    @Req() req: any
  ) {
    return this.storesService.createStore(createStoreDto, req.user.id);
  }

  @Get('owner/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my stores',
    description: 'Get all stores owned by the authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user\'s stores'
  })
  async getMyStores(@Req() req: any) {
    return this.storesService.getStoresByOwner(req.user.id);
  }

  @Post(':id/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add product to store',
    description: 'Add a new product to the specified store (owner only)'
  })
  @ApiResponse({
    status: 201,
    description: 'Product added successfully'
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to modify this store'
  })
  async addProduct(
    @Param('id', ParseIntPipe) storeId: number,
    @Body() createProductDto: CreateProductDto,
    @Req() req: any
  ) {
    return this.storesService.addProduct(storeId, createProductDto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update store',
    description: 'Update store information (owner only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully'
  })
  async updateStore(
    @Param('id', ParseIntPipe) storeId: number,
    @Body() updateData: Partial<CreateStoreDto>,
    @Req() req: any
  ) {
    return this.storesService.updateStore(storeId, updateData, req.user.id);
  }

  @Put(':storeId/products/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update product',
    description: 'Update product information (store owner only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully'
  })
  async updateProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateData: Partial<CreateProductDto>,
    @Req() req: any
  ) {
    return this.storesService.updateProduct(storeId, productId, updateData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete store',
    description: 'Delete store (owner only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Store deleted successfully'
  })
  async deleteStore(
    @Param('id', ParseIntPipe) storeId: number,
    @Req() req: any
  ) {
    return this.storesService.deleteStore(storeId, req.user.id);
  }

  @Delete(':storeId/products/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete product',
    description: 'Delete product from store (store owner only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully'
  })
  async deleteProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Req() req: any
  ) {
    return this.storesService.deleteProduct(storeId, productId, req.user.id);
  }
}