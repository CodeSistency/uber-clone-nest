import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WalletRateLimitService } from '../services/wallet-rate-limit.service';

export const WALLET_RATE_LIMIT_KEY = 'wallet_rate_limit';
export const WalletRateLimit = (operation: string) =>
  SetMetadata(WALLET_RATE_LIMIT_KEY, operation);

@Injectable()
export class WalletRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: WalletRateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const operation = this.reflector.get<string>(
      WALLET_RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!operation) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip || request.connection.remoteAddress;

    if (!user?.id) {
      throw new HttpException(
        'Usuario no autenticado',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const result = await this.rateLimitService.checkRateLimit(
        user.id,
        operation,
        ipAddress,
      );

      if (!result.allowed) {
        const retryAfter = result.retryAfter || 3600; // Default 1 hour
        throw new HttpException(
          {
            message: 'Límite de solicitudes excedido',
            retryAfter,
            resetTime: result.resetTime,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Add rate limit info to response headers
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', this.getMaxAttempts(operation));
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(result.resetTime.getTime() / 1000),
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Log error but don't block the request
      console.error('Error en rate limiting:', error);
      return true;
    }
  }

  private getMaxAttempts(operation: string): number {
    const limits: Record<string, number> = {
      addFunds: 5,
      transfer: 10,
      validate: 20,
      balance: 30,
      transactions: 50,
    };
    return limits[operation] || 10;
  }
}
