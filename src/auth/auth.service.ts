import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import {
  JwtPayload,
  RefreshTokenPayload,
  RegisterResult,
  LoginResult,
} from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Registra un nuevo usuario
   */
  async register(registerDto: RegisterDto): Promise<RegisterResult> {
    const {
      email,
      password,
      name,
      phone,
      country,
      state,
      city,
      dateOfBirth,
      gender,
      preferredLanguage,
      timezone,
      firebaseToken,
      deviceType,
      deviceId,
    } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Hash de la contraseña
    const hashedPassword = await this.hashPassword(password);

    // Crear usuario con campos opcionales
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone,
        country,
        state,
        city,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        preferredLanguage: preferredLanguage || 'es',
        timezone: timezone || 'America/Caracas',
      },
    });

    // Generar tokens
    const tokens = await this.generateTokens(user);

    // Registrar token de Firebase si se proporcionó
    if (firebaseToken) {
      try {
        await this.notificationsService.registerPushToken(
          user.id.toString(),
          firebaseToken,
          deviceType,
          deviceId,
        );
      } catch (error) {
        // Log error pero no fallar el registro por esto
        console.warn(
          'Error registering Firebase token during registration:',
          error.message,
        );
      }
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Inicia sesión de un usuario
   */
  async login(loginDto: LoginDto): Promise<LoginResult> {
    const { email, password, firebaseToken, deviceType, deviceId } = loginDto;

    // Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // Verificar contraseña
    if (!user.password) {
      throw new UnauthorizedException(
        'Este usuario no tiene una contraseña configurada. Use el sistema de recuperación de contraseña.',
      );
    }

    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generar tokens
    const tokens = await this.generateTokens(user);

    // Obtener permisos y grupos del usuario

    // Registrar token de Firebase si se proporcionó
    if (firebaseToken) {
      try {
        await this.notificationsService.registerPushToken(
          user.id.toString(),
          firebaseToken,
          deviceType,
          deviceId,
        );
      } catch (error) {
        // Log error pero no fallar el login por esto
        console.warn(
          'Error registering Firebase token during login:',
          error.message,
        );
      }
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      email: string;
      name: string;
    };
  }> {
    try {
      // Verificar el refresh token
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshToken,
        {
          secret: process.env.JWT_SECRET || 'fallback-secret-key',
        },
      );

      // Buscar usuario
      const user = await this.prisma.user.findUnique({
        where: { id: Number(payload.sub) },
      });
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Generar nuevos tokens
      const tokens = await this.generateTokens(user);

      // Obtener permisos y grupos del usuario

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  /**
   * Genera access token y refresh token para un usuario
   */
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id.toString(),
      tokenId: this.generateTokenId(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Hashea una contraseña
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Valida una contraseña contra su hash
   */
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Genera un ID único para el refresh token
   */
  private generateTokenId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Obtiene el perfil del usuario actual con permisos
   */
  async getProfile(userId: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        emergencyContacts: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
    };
  }
}
