/**
 * Referral Status Types
 * Defines the possible states of a referral relationship
 */
export type ReferralStatus = 'pending' | 'converted' | 'expired' | 'cancelled';

/**
 * Helper object for checking referral status values
 */
export const ReferralStatusValues = {
  PENDING: 'pending' as ReferralStatus,
  CONVERTED: 'converted' as ReferralStatus,
  EXPIRED: 'expired' as ReferralStatus,
  CANCELLED: 'cancelled' as ReferralStatus,
} as const;
