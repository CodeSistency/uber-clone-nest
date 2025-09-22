import { PartialType } from '@nestjs/swagger';
import { AdminCreateStoreDto } from './create-store.dto';

export class UpdateStoreDto extends PartialType(AdminCreateStoreDto) {}
