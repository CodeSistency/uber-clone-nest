import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { StoresService } from '../stores.service';

@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(private storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const storeId = +request.params.id || +request.params.storeId;
    const userId = request.user?.id;

    if (!storeId || !userId) {
      return false;
    }

    try {
      await this.storesService.isStoreOwner(storeId, userId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
