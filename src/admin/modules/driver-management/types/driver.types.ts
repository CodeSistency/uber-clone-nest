export type DriverStatus = 'active' | 'inactive' | 'suspended';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface DriverDocumentDto {
  id: number;
  type: string;
  status: string;
  url: string;
  uploadedAt: Date;
  driverId: number;
}

export interface DriverWithUserDto {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'suspended' | 'active' | 'inactive';
  isOnline: boolean;
  lastActive: Date | null;
  profileImageUrl: string | null;
  carImageUrl: string | null;
  carModel: string | null;
  licensePlate: string | null;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  documents: DriverDocumentDto[];
  verificationStatus: string | null;
  verifiedAt: Date | null;
  verificationNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetDriversResponse {
  success: boolean;
  data: DriverWithUserDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
