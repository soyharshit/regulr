export const POINTS_TO_PAISE_RATE = 10; // 100 points -> 1000 paise (Rs 10) off

export interface ResolvedCoupon {
  discountPercent?: number; // e.g. 10 for 10%
  discountPaise?: number; // flat amount off
}

export interface PricingInput {
  subtotal: number; // in paise
  flashDiscount?: number; // in paise
  couponCode?: string;
  /** Coupon looked up and validated by the caller (repository lookup happens outside this pure module). */
  resolvedCoupon?: ResolvedCoupon | null;
  loyaltyTierPointsApplied?: number;
  gstRate: number; // e.g. 0.05 for 5%
}

export interface PricingResult {
  subtotal: number;
  flashDiscount: number;
  couponDiscount: number;
  tierDiscount: number;
  gstAmount: number; // inclusive GST
  grandTotal: number;
}

export function calculateOrderTotal(input: PricingInput): PricingResult {
  let { subtotal, flashDiscount = 0, gstRate } = input;

  if (flashDiscount > subtotal) {
    flashDiscount = subtotal;
  }

  let totalBeforeGst = subtotal - flashDiscount;

  let couponDiscount = 0;
  const coupon = input.resolvedCoupon;
  if (coupon) {
    if (coupon.discountPercent) {
      couponDiscount = Math.round(totalBeforeGst * (coupon.discountPercent / 100));
    } else if (coupon.discountPaise) {
      couponDiscount = coupon.discountPaise;
    }
    if (couponDiscount > totalBeforeGst) couponDiscount = totalBeforeGst;
  }
  totalBeforeGst -= couponDiscount;

  let tierDiscount = 0;
  if (input.loyaltyTierPointsApplied) {
    tierDiscount = input.loyaltyTierPointsApplied * POINTS_TO_PAISE_RATE;
  }
  if (tierDiscount > totalBeforeGst) tierDiscount = totalBeforeGst;
  totalBeforeGst -= tierDiscount;

  if (totalBeforeGst < 0) totalBeforeGst = 0;

  // Inclusive GST carve-out:
  // gstAmount = totalBeforeGst * (gstRate / (1 + gstRate))
  const gstAmount = Math.round(totalBeforeGst * (gstRate / (1 + gstRate)));

  return {
    subtotal,
    flashDiscount,
    couponDiscount,
    tierDiscount,
    gstAmount,
    grandTotal: totalBeforeGst,
  };
}
