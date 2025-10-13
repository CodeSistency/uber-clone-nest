/**
 * Interfaces para el sistema de verificación de seguridad
 */

export enum VerificationType {
  EMAIL_CHANGE = 'email_change',
  PASSWORD_CHANGE = 'password_change',
  PHONE_CHANGE = 'phone_change',
  IDENTITY_VERIFICATION = 'identity_verification',
}

export enum IdentityVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface VerificationCodeData {
  id: number;
  userId: number;
  type: VerificationType;
  code: string;
  target: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
  verifiedAt?: Date;
}

export interface IdentityVerificationData {
  id: number;
  userId: number;
  dniNumber: string;
  frontPhotoUrl: string;
  backPhotoUrl: string;
  status: IdentityVerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: number;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
  expiresAt?: Date;
}

export interface EmailVerificationData {
  email: string;
  code: string;
  type: VerificationType;
  userName?: string;
}

export interface SMSVerificationData {
  phone: string;
  code: string;
  userName?: string;
}

export interface IdentityVerificationRequest {
  dniNumber: string;
  frontPhoto: Express.Multer.File;
  backPhoto: Express.Multer.File;
}

export interface AdminVerificationRequest {
  verificationId: number;
  status: 'verified' | 'rejected';
  reason?: string;
  adminId: number;
}
