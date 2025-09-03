import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);

  constructor(private configService: AppConfigService) {}

  /**
   * Verifica y decodifica un token JWT de Clerk
   * @param token - Token JWT de Clerk
   * @returns Información del usuario decodificada
   */
  async verifyToken(token: string): Promise<any> {
    try {
      if (!token) {
        throw new UnauthorizedException('Token no proporcionado');
      }

      // En desarrollo, decodificamos el token JWT directamente
      // En producción, deberías usar la clave pública de Clerk para verificar
      const decoded = this.decodeToken(token);

      // Verificar que el token no haya expirado
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        throw new UnauthorizedException('Token expirado');
      }

      // Verificar que sea un token de Clerk (básico)
      if (!decoded.iss || !decoded.iss.includes('clerk')) {
        // En desarrollo, ser más flexible con la validación
        if (this.configService.app.environment !== 'production') {
          this.logger.warn('Token no contiene issuer de Clerk, permitiendo en desarrollo');
        } else {
          throw new UnauthorizedException('Token no válido de Clerk');
        }
      }

      this.logger.debug(`Token verificado para usuario: ${decoded.sub}`);
      return decoded;
    } catch (error) {
      this.logger.error(`Error verificando token: ${error.message}`);
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Extrae el Clerk ID del token decodificado
   * @param token - Token JWT
   * @returns Clerk ID del usuario
   */
  getClerkIdFromToken(token: string): string {
    try {
      const decoded = this.decodeToken(token);
      const clerkId = decoded.sub || decoded.userId;

      if (!clerkId) {
        throw new UnauthorizedException('No se pudo extraer el Clerk ID del token');
      }

      return clerkId;
    } catch (error) {
      this.logger.error(`Error extrayendo Clerk ID: ${error.message}`);
      throw new UnauthorizedException('No se pudo extraer el Clerk ID del token');
    }
  }

  /**
   * Método auxiliar para decodificar token JWT
   * NOTA: En producción, usa la verificación completa con la clave pública de Clerk
   */
  private decodeToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Token JWT malformado');
    }

    try {
      // Decodificar el payload (segunda parte del JWT)
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
      );
      return payload;
    } catch (error) {
      this.logger.error(`Error decodificando token: ${error.message}`);
      throw new UnauthorizedException('Error al decodificar token');
    }
  }

  /**
   * Verifica si el usuario está autenticado
   * @param request - Request object
   * @returns true si está autenticado
   */
  async isAuthenticated(request: any): Promise<boolean> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    try {
      await this.verifyToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extrae información adicional del usuario del token
   * @param token - Token JWT
   * @returns Información del usuario
   */
  getUserInfoFromToken(token: string): any {
    try {
      const decoded = this.decodeToken(token);
      return {
        clerkId: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        username: decoded.username,
        imageUrl: decoded.imageUrl,
        exp: decoded.exp,
        iat: decoded.iat,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo info de usuario: ${error.message}`);
      return null;
    }
  }
}
