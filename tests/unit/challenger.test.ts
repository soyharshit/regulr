import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import * as orderRepo from "@/lib/repositories/order";
import * as customerRepo from "@/lib/repositories/customer";
import * as userRepo from "@/lib/repositories/user";
import * as referralRepo from "@/lib/repositories/referral";

describe("Challenger Cross-Tenant Injection Tests", () => {
  let cafeAId: string;
  let cafeBId: string;
  let userA: any;
  let userB: any;
  let customerA: any; // Belongs to Cafe A
  let customerB: any; // Belongs to Cafe B

  beforeEach(async () => {
    // Clean up
    await db.referral.deleteMany({});
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.menuItem.deleteMany({});
    await db.customer.deleteMany({});
    await db.user.deleteMany({});
    await db.cafe.deleteMany({});

    // Setup Cafes
    const cafeA = await db.cafe.create({ data: { name: "Cafe A", slug: "cafe-a-challenge" } });
    const cafeB = await db.cafe.create({ data: { name: "Cafe B", slug: "cafe-b-challenge" } });
    cafeAId = cafeA.id;
    cafeBId = cafeB.id;

    // Setup Users
    userA = await userRepo.create({ email: "userA@challenge.com", name: "User A" });
    userB = await userRepo.create({ email: "userB@challenge.com", name: "User B" });

    // Setup Customers strictly segregated by cafe
    customerA = await customerRepo.create(cafeAId, { user: { connect: { id: userA.id } } });
    customerB = await customerRepo.create(cafeBId, { user: { connect: { id: userB.id } } });
  });

  it("should fail when creating an order in Cafe A connected to a Customer from Cafe B", async () => {
    let order: any = null;
    try {
      order = await orderRepo.create(cafeAId, {
        totalAmount: 1000,
        status: "PENDING",
        customer: { connect: { id: customerB.id } }
      });
    } catch (e) {}

    if (order) {
      const fetchedOrder = await db.order.findUnique({ where: { id: order.id } });
      expect(fetchedOrder).toBeNull(); 
    } else {
      expect(order).toBeNull();
    }
  });

  it("should fail when creating a referral in Cafe A linking to Customers from Cafe B", async () => {
    const userC = await userRepo.create({ email: "userC@challenge.com", name: "User C" });
    const customerC = await customerRepo.create(cafeBId, { user: { connect: { id: userC.id } } });

    let referral: any = null;
    try {
      referral = await referralRepo.create(cafeAId, customerB.id, customerC.id);
    } catch (e) {}

    if (referral) {
      await referralRepo.complete(cafeAId, referral.id, 500);
    }

    const updatedCustomerB = await db.customer.findUnique({ where: { id: customerB.id } });
    expect(updatedCustomerB?.points).toBe(0);
  });

  it("should fail when creating an order in Cafe A containing MenuItems from Cafe B", async () => {
    await db.menuItem.create({ data: { name: "Item A", price: 100, cafe: { connect: { id: cafeAId } } } });
    const menuItemB = await db.menuItem.create({ data: { name: "Item B", price: 200, cafe: { connect: { id: cafeBId } } } });

    let order: any = null;
    try {
      order = await orderRepo.create(cafeAId, {
        totalAmount: 200,
        status: "PENDING",
        customer: { connect: { id: customerA.id } },
        orderItems: {
          create: [
            {
              menuItem: { connect: { id: menuItemB.id } },
              quantity: 1,
              price: 200
            }
          ]
        }
      });
    } catch (e) {}

    if (order) {
      const fetchedOrder = await db.order.findUnique({ where: { id: order.id }, include: { orderItems: true } });
      expect(fetchedOrder).toBeNull();
    } else {
      expect(order).toBeNull();
    }
  });
});
