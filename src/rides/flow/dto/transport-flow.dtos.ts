import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class DefineRideDto {
  @IsNotEmpty()
  @IsString()
  originAddress: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  originLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  originLng: number;

  @IsNotEmpty()
  @IsString()
  destinationAddress: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLng: number;

  @IsNumber()
  @Min(1)
  minutes: number;

  @IsOptional()
  @IsNumber()
  tierId?: number;

  @IsOptional()
  @IsNumber()
  vehicleTypeId?: number;
}

export class ConfirmRidePaymentDto {
  @IsIn(['cash', 'card'])
  method: 'cash' | 'card';

  @IsOptional()
  @IsString()
  clientSecret?: string;
}

export class RateRideFlowDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}


