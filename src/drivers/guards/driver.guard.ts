import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DriverGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || typeof user.id !== 'number') {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is a driver
    const driver = await this.prisma.driver.findUnique({
      where: { id: user.id },
    });

    if (!driver) {
      throw new ForbiddenException('User is not a driver');
    }

    // Add driver info to request for use in controllers
    request.driver = driver;

    return true;
  }
}
