import { describe, it, expect } from 'vitest';
import { calculateOrderTotal } from '../../src/lib/pricing/pricingEngine';

describe('Pricing Engine', () => {
  it('should calculate inclusive GST correctly (carve-out)', () => {
    // 200 rupees = 20000 paise
    // GST = 5% = 0.05
    // Carve out GST: 20000 * 0.05 / 1.05 = 952.38 -> 952
    const result = calculateOrderTotal({
      subtotal: 20000,
      gstRate: 0.05,
    });
    expect(result.gstAmount).toBe(952);
    expect(result.grandTotal).toBe(20000);
  });

  it('should handle flash discount correctly', () => {
    const result = calculateOrderTotal({
      subtotal: 10000,
      flashDiscount: 2000,
      gstRate: 0.05,
    });
    expect(result.grandTotal).toBe(8000);
  });

  it('should floor flash discount if it exceeds subtotal', () => {
    const result = calculateOrderTotal({
      subtotal: 10000,
      flashDiscount: 15000,
      gstRate: 0.05,
    });
    expect(result.grandTotal).toBe(0);
    expect(result.flashDiscount).toBe(10000); // capped at subtotal
  });
});
