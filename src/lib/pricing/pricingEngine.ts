// ALL arithmetic in integer paise. No floating point.

export interface PricingInput {
  subtotal: number;           // in paise
  flashDiscount?: number;     // in paise
  couponCode?: string;
  couponDiscount?: number;    // in paise (pre-calculated from coupon lookup)
  loyaltyTierPointsApplied?: number; // points → paise discount
  gstRate: number;            // e.g. 0.05 for 5%
}

export interface PricingResult {
  subtotal: number;           // original subtotal
  flashDiscount: number;      // applied flash discount (floored at 0)
  couponDiscount: number;     // applied coupon discount
  tierDiscount: number;       // loyalty tier discount
  preTaxTotal: number;        // after all discounts
  gstAmount: number;          // INCLUSIVE GST carved out from preTaxTotal
  grandTotal: number;         // = preTaxTotal (GST is inclusive, not added)
}

export function calculateOrderTotal(input: PricingInput): PricingResult {
  // Step 1: Flash discount (never negative)
  const flashDiscount = Math.min(input.flashDiscount ?? 0, input.subtotal);
  let running = input.subtotal - flashDiscount;

  // Step 2: Coupon discount (never negative)
  const couponDiscount = Math.min(input.couponDiscount ?? 0, running);
  running = running - couponDiscount;

  // Step 3: Tier perk discount (loyalty points redeemed)
  const tierDiscount = Math.min(input.loyaltyTierPointsApplied ?? 0, running);
  running = running - tierDiscount;

  // Step 4: Inclusive GST carve-out
  // GST is INCLUDED in the price, not added on top
  // gstAmount = total * rate / (1 + rate), floored to integer paise
  const gstAmount = Math.floor(running * input.gstRate / (1 + input.gstRate));

  return {
    subtotal: input.subtotal,
    flashDiscount,
    couponDiscount,
    tierDiscount,
    preTaxTotal: running,
    gstAmount,
    grandTotal: running, // inclusive GST means grand total = preTaxTotal
  };
}
