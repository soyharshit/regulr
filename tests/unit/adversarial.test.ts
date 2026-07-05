import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import * as menuItemRepo from "@/lib/repositories/menuItem";
import * as orderRepo from "@/lib/repositories/order";
import * as customerRepo from "@/lib/repositories/customer";
import * as userRepo from "@/lib/repositories/user";

describe("Adversarial Tenant Isolation Tests", () => {
  let cafeAId: string;
  let cafeBId: string;
  let userA: any;
  let userB: any;
  let customerA: any;
  let customerB: any;

  beforeEach(async () => {
    // Clear all existing data
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.menuItem.deleteMany({});
    await db.customer.deleteMany({});
    await db.user.deleteMany({});
    await db.cafe.deleteMany({});

    // Onboard two distinct cafes
    const cafeA = await db.cafe.create({ data: { name: "Cafe A", slug: "cafe-a" } });
    const cafeB = await db.cafe.create({ data: { name: "Cafe B", slug: "cafe-b" } });
    cafeAId = cafeA.id;
    cafeBId = cafeB.id;

    userA = await userRepo.create({ email: "userA@test.com", name: "User A" });
    userB = await userRepo.create({ email: "userB@test.com", name: "User B" });

    customerA = await customerRepo.create(cafeAId, { user: { connect: { id: userA.id } } });
    customerB = await customerRepo.create(cafeBId, { user: { connect: { id: userB.id } } });
  });

  it("should prevent cross-tenant assignment via menuItem update injection", async () => {
    const itemA = await menuItemRepo.create(cafeAId, { name: "Latte A", price: 20000 });
    
    // Attacker from Cafe A tries to move their item to Cafe B
    // by passing cafeId in the update data.
    await menuItemRepo.update(cafeAId, itemA.id, {
      name: "Latte A (Hacked)",
      cafeId: cafeBId
    } as any);

    // Verify if it moved
    const itemAfter = await db.menuItem.findUnique({ where: { id: itemA.id } });
    
    // If it was moved to Cafe B, isolation is broken.
    expect(itemAfter?.cafeId).not.toBe(cafeBId);
    expect(itemAfter?.cafeId).toBe(cafeAId);
  });

  it("should prevent cross-tenant customer linkage in order create", async () => {
    // Attacker in Cafe A tries to link an order to a Customer from Cafe B
    let order: any = null;
    try {
      order = await orderRepo.create(cafeAId, {
        totalAmount: 1000,
        status: "PENDING",
        customer: { connect: { id: customerB.id } }
      } as any);
    } catch (e) {
      // Expected to throw
    }

    if (order) {
      const orderAfter = await db.order.findUnique({ where: { id: order.id }, include: { customer: true } });
      expect(orderAfter?.customer?.cafeId).not.toBe(cafeBId);
    } else {
      expect(order).toBeNull();
    }
  });
});
