import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DriverProfileDto {
  @ApiProperty({
    description: 'Driver ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  email?: string | null;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Main Street',
  })
  address?: string | null;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Caracas',
  })
  city?: string | null;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Distrito Capital',
  })
  state?: string | null;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '1010',
  })
  postalCode?: string | null;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
  })
  profileImageUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15',
  })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'male',
  })
  gender?: string | null;

  @ApiProperty({
    description: 'Current status',
    example: 'online',
  })
  status: string;

  @ApiProperty({
    description: 'Verification status',
    example: 'approved',
  })
  verificationStatus: string;

  @ApiProperty({
    description: 'Can do deliveries',
    example: true,
  })
  canDoDeliveries: boolean;

  @ApiProperty({
    description: 'Average rating',
    example: 4.8,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Total rides completed',
    example: 150,
  })
  totalRides: number;

  @ApiProperty({
    description: 'Total earnings',
    example: 12500.75,
  })
  totalEarnings: number;

  @ApiProperty({
    description: 'Completion rate percentage',
    example: 98.5,
  })
  completionRate: number;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '1234567890',
  })
  bankAccountNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'Banco Nacional',
  })
  bankName?: string | null;

  @ApiPropertyOptional({
    description: 'Tax ID',
    example: 'V-12345678',
  })
  taxId?: string | null;

  @ApiProperty({
    description: 'Current location',
  })
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    lastUpdate: string | null;
  };

  @ApiProperty({
    description: 'Vehicles owned by the driver',
    type: [Object],
  })
  vehicles: Array<{
    id: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    status: string;
    isDefault: boolean;
    vehicleType: {
      id: number;
      name: string;
      displayName: string;
    };
  }>;

  @ApiProperty({
    description: 'Work zones assigned to the driver',
    type: [Object],
  })
  workZones: Array<{
    id: number;
    name: string;
    city: string;
    state: string;
    isPrimary: boolean;
    status: string;
  }>;

  @ApiProperty({
    description: 'Payment methods',
    type: [Object],
  })
  paymentMethods: Array<{
    id: number;
    methodType: string;
    accountName?: string | null;
    bankName?: string | null;
    isDefault: boolean;
    isActive: boolean;
  }>;

  @ApiProperty({
    description: 'Verification documents',
    type: [Object],
  })
  documents: Array<{
    id: number;
    documentType: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;

  @ApiProperty({
    description: 'Recent rides',
    type: [Object],
  })
  recentRides: Array<{
    id: number;
    originAddress: string;
    destinationAddress: string;
    farePrice: number;
    status: string;
    createdAt: string;
    rating?: number | null;
  }>;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'Last login date',
    example: '2024-01-15T09:00:00Z',
  })
  lastLogin?: string | null;

  @ApiPropertyOptional({
    description: 'Last active date',
    example: '2024-01-15T10:30:00Z',
  })
  lastActive?: string | null;
}
