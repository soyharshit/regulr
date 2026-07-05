import { db } from "../db";
import { Customer } from "@prisma/client";

/** Derives a stable, shareable referral code from a customer id — no extra schema/migration needed. */
export function referralCodeForCustomer(customerId: string): string {
  return "RG-" + customerId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export async function findCustomerByReferralCode(
  cafeId: string,
  code: string
): Promise<Customer | null> {
  const normalized = code.trim().toUpperCase();
  const customers = await db.customer.findMany({ where: { cafeId } });
  return customers.find((c) => referralCodeForCustomer(c.id) === normalized) || null;
}
