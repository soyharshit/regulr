import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import * as menuItemRepo from "@/lib/repositories/menuItem";
import * as orderRepo from "@/lib/repositories/order";
import * as customerRepo from "@/lib/repositories/customer";
import * as userRepo from "@/lib/repositories/user";

describe("More Adversarial Tests", () => {
  let cafeAId: string;
  let cafeBId: string;
  let userA: any;
  let userB: any;
  let customerA: any;
  let itemB: any;

  beforeEach(async () => {
    // Clear all existing data
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.menuItem.deleteMany({});
    await db.customer.deleteMany({});
    await db.user.deleteMany({});
    await db.cafe.deleteMany({});

    const cafeA = await db.cafe.create({ data: { name: "Cafe A", slug: "cafe-a" } });
    const cafeB = await db.cafe.create({ data: { name: "Cafe B", slug: "cafe-b" } });
    cafeAId = cafeA.id;
    cafeBId = cafeB.id;

    userA = await userRepo.create({ email: "userA@test.com", name: "User A" });

    customerA = await customerRepo.create(cafeAId, { user: { connect: { id: userA.id } } });

    itemB = await menuItemRepo.create(cafeBId, { name: "Latte B", price: 200 });
  });

  it("should prevent creating order with items from another cafe", async () => {
    // Attacker in Cafe A tries to create an order with a menu item from Cafe B
    let order: any = null;
    try {
      order = await orderRepo.create(cafeAId, {
        totalAmount: 200,
        status: "PENDING",
        customer: { connect: { id: customerA.id } },
        orderItems: {
          create: [
            {
              quantity: 1,
              price: 200,
              menuItem: { connect: { id: itemB.id } }
            }
          ]
        }
      } as any);
    } catch (error) {
      // expected to throw
    }

    if (order) {
      const orderAfter = await db.order.findUnique({
        where: { id: order.id },
        include: { orderItems: { include: { menuItem: true } } }
      });
      expect(orderAfter?.orderItems[0].menuItem.cafeId).not.toBe(cafeBId);
    } else {
      expect(order).toBeNull();
    }
  });
});
