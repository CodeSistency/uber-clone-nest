import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminLoginDto } from '../dto/login.dto';
import {
  BAD_REQUEST_RESPONSE,
  INTERNAL_SERVER_ERROR_RESPONSE,
  NOT_FOUND_RESPONSE,
  UNAUTHORIZED_RESPONSE,
} from 'swagger/response';
import { RefreshTokenParams } from '../dto/admin-login.dto';

// Reusable Swagger response schemas
@Controller('admin/auth')
@ApiTags('admin/auth')
@ApiBadRequestResponse(BAD_REQUEST_RESPONSE)
@ApiUnauthorizedResponse(UNAUTHORIZED_RESPONSE)
@ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_RESPONSE)
export class AdminAuthController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin Login' })
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ description: 'Successfully authenticated' })
  async login(@Body() loginDto: AdminLoginDto) {
    try {
      return await this.adminService.login(loginDto);
    } catch (error) {
      console.error('[Login error]', error);
      throw error;
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: 'Exchange a valid refresh token for a new access token.',
  })
  @ApiBody({ type: RefreshTokenParams })
  @ApiOkResponse({ description: 'Token refreshed successfully' })
  async refreshToken(@Body() body: RefreshTokenParams) {
    try {
      return await this.adminService.refreshTokens(body);
    } catch (error) {
      console.error('[Login error]', error);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary: 'Admin Logout',
    description: 'Invalidate refresh token and logout the admin.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Successfully logged out' })
  logout() {
    return { success: true, message: 'Successfully logged out' };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({
    summary: 'Get Current Admin Profile',
    description: 'Retrieve the authenticated admin profile.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Admin profile retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
  @ApiResponse(NOT_FOUND_RESPONSE)
  async getProfile(@Request() req: { user: { id: number } }) {
    const admin = await this.adminService.FindAdminById(req.user.id);
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }
}
