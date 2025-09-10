export interface PaymentValidation {
  confirmed: boolean;
  transactionId?: string;
  amount?: number;
  timestamp?: Date;
  bankCode?: string;
  message?: string;
  error?: string;
}

export interface BankApiInterface {
  verifyPayment(referenceNumber: string): Promise<PaymentValidation>;
  getBankInfo(): BankInfo;
}

export interface BankInfo {
  code: string;
  name: string;
  methods: PaymentMethod[];
}

export type PaymentMethod = 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin';

export type PaymentStatus = 'pending' | 'confirmed' | 'expired' | 'failed';

export interface PaymentReferenceData {
  referenceNumber: string;
  bankCode: string;
  amount: number;
  currency: string;
  userId: number;
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';
  serviceId: number;
  status: PaymentStatus;
  expiresAt: Date;
  createdAt: Date;
}
