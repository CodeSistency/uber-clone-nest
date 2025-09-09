import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateErrandDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  itemsList?: string; // Free-text list of items

  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @IsNumber()
  pickupLat: number;

  @IsNumber()
  pickupLng: number;

  @IsNotEmpty()
  @IsString()
  dropoffAddress: string;

  @IsNumber()
  dropoffLat: number;

  @IsNumber()
  dropoffLng: number;
}

export class ErrandShoppingUpdateDto {
  @IsNumber()
  @Min(0)
  itemsCost: number;

  @IsOptional()
  @IsString()
  notes?: string;
}


