import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StoresService } from '../stores.service';

@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(private readonly storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const storeId = +request.params.id || +request.params.storeId;
    const userId = request.user?.clerkId;

    if (!userId) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!storeId) {
      throw new ForbiddenException('ID de tienda no proporcionado');
    }

    const isOwner = await this.storesService.isStoreOwner(storeId, userId);

    if (!isOwner) {
      throw new ForbiddenException('No tienes permisos para gestionar esta tienda');
    }

    return true;
  }
}
