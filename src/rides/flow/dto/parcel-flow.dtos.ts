import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateParcelDto {
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

  @IsIn(['documents', 'electronics', 'fragile', 'other'])
  type: 'documents' | 'electronics' | 'fragile' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class ProofOfDeliveryDto {
  @IsOptional()
  @IsString()
  signatureImageUrl?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}


