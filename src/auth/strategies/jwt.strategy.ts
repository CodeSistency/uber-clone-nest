import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId } = payload;

    // Buscar usuario por ID
    const user = await this.prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Buscar si el usuario es también conductor
    const driver = await this.prisma.driver.findFirst({
      where: { id: Number(userId) }, // Asumiendo que el driver ID es el mismo que el user ID
      select: {
        id: true,
        status: true,
        verificationStatus: true,
      },
    });

    // Retornar información del usuario (esto se adjunta al request)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      clerkId: null, // Siempre null ya que no usamos Clerk
      driverId: driver?.id || null, // ID del conductor si existe
      driverStatus: driver?.status || null, // Estado del conductor
      driverVerificationStatus: driver?.verificationStatus || null, // Estado de verificación
    };
  }
}
