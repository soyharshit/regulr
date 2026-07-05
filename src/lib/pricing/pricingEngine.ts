export interface PricingInput {
  subtotal: number; // in paise
  flashDiscount?: number; // in paise
  couponCode?: string;
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
  let couponDiscount = 0; // Stub
  totalBeforeGst -= couponDiscount;
  
  let tierDiscount = 0; // Stub
  if (input.loyaltyTierPointsApplied) {
    tierDiscount = input.loyaltyTierPointsApplied * 10; // 10 paise per point
  }
  totalBeforeGst -= tierDiscount;
  
  if (totalBeforeGst < 0) totalBeforeGst = 0;
  
  // Inclusive GST carve-out: 
  // gstAmount = totalBeforeGst * (gstRate / (1 + gstRate))
  let gstAmount = Math.round(totalBeforeGst * (gstRate / (1 + gstRate)));
  
  return {
    subtotal,
    flashDiscount,
    couponDiscount,
    tierDiscount,
    gstAmount,
    grandTotal: totalBeforeGst
  };
}
