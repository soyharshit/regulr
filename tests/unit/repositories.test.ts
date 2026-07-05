import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import * as menuItemRepo from "@/lib/repositories/menuItem";
import * as orderRepo from "@/lib/repositories/order";
import * as customerRepo from "@/lib/repositories/customer";
import * as userRepo from "@/lib/repositories/user";
import * as referralRepo from "@/lib/repositories/referral";

describe("Tenant Isolation Repository Tests", () => {
  let cafeAId: string;
  let cafeBId: string;
  let userA: any;
  let userB: any;
  let userC: any;
  let customerA: any;
  let customerB: any;
  let customerC: any;

  beforeEach(async () => {
    // Clear all existing data in clean database
    await db.referral.deleteMany({});
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

    // Create users
    userA = await userRepo.create({ email: "userA@test.com", name: "User A" });
    userB = await userRepo.create({ email: "userB@test.com", name: "User B" });
    userC = await userRepo.create({ email: "userC@test.com", name: "User C" });

    // Create customers
    customerA = await customerRepo.create(cafeAId, {
      user: { connect: { id: userA.id } }
    });
    customerB = await customerRepo.create(cafeBId, {
      user: { connect: { id: userB.id } }
    });
    customerC = await customerRepo.create(cafeAId, {
      user: { connect: { id: userC.id } }
    });
  });

  describe("MenuItem Repository", () => {
    it("should isolate MenuItems between Cafe A and Cafe B", async () => {
      const itemA = await menuItemRepo.create(cafeAId, { name: "Latte A", price: 20000 });
      const itemB = await menuItemRepo.create(cafeBId, { name: "Latte B", price: 22000 });

      // Cafe A cannot read Cafe B's menu items in a list
      const listA = await menuItemRepo.list(cafeAId);
      expect(listA.length).toBe(1);
      expect(listA[0].id).toBe(itemA.id);

      // Cafe A cannot retrieve Cafe B's menu item directly
      const fetchBWithA = await menuItemRepo.getById(cafeAId, itemB.id);
      expect(fetchBWithA).toBeNull();

      // Cafe A cannot update Cafe B's menu item
      await expect(menuItemRepo.update(cafeAId, itemB.id, { name: "Latte B updated" })).rejects.toThrow();

      // Cafe A cannot delete Cafe B's menu item
      await expect(menuItemRepo.delete(cafeAId, itemB.id)).rejects.toThrow();

      // Safe update
      const updated = await menuItemRepo.update(cafeAId, itemA.id, { name: "Latte A updated" });
      expect(updated.name).toBe("Latte A updated");

      // Safe delete
      await menuItemRepo.delete(cafeAId, itemA.id);
      const listAfterDelete = await menuItemRepo.list(cafeAId);
      expect(listAfterDelete.length).toBe(0);
    });
  });

  describe("Order Repository", () => {
    it("should isolate Orders between Cafe A and Cafe B", async () => {
      const orderA = await orderRepo.create(cafeAId, {
        totalAmount: 50000,
        status: "PENDING",
        customer: { connect: { id: customerA.id } }
      });
      const orderB = await orderRepo.create(cafeBId, {
        totalAmount: 60000,
        status: "PENDING",
        customer: { connect: { id: customerB.id } }
      });

      // Cafe A cannot read Cafe B's orders in a list
      const listA = await orderRepo.list(cafeAId);
      expect(listA.length).toBe(1);
      expect(listA[0].id).toBe(orderA.id);

      // Cafe A cannot retrieve Cafe B's order directly
      const fetchBWithA = await orderRepo.getById(cafeAId, orderB.id);
      expect(fetchBWithA).toBeNull();

      // Cafe A cannot update the status of Cafe B's order
      await expect(orderRepo.updateStatus(cafeAId, orderB.id, "COMPLETED")).rejects.toThrow();

      // Safe update status
      const updated = await orderRepo.updateStatus(cafeAId, orderA.id, "READY");
      expect(updated.status).toBe("READY");
    });
  });

  describe("Customer Repository", () => {
    it("should isolate Customer profiles between Cafe A and Cafe B", async () => {
      // getById
      const fetchBWithA = await customerRepo.getById(cafeAId, customerB.id);
      expect(fetchBWithA).toBeNull();

      const fetchAWithA = await customerRepo.getById(cafeAId, customerA.id);
      expect(fetchAWithA).not.toBeNull();
      expect(fetchAWithA?.id).toBe(customerA.id);

      // getByUserId
      const fetchUserBWithA = await customerRepo.getByUserId(cafeAId, userB.id);
      expect(fetchUserBWithA).toBeNull();

      // updatePoints
      await expect(customerRepo.updatePoints(cafeAId, customerB.id, 100)).rejects.toThrow();

      const updated = await customerRepo.updatePoints(cafeAId, customerA.id, 50);
      expect(updated.points).toBe(50);
    });
  });

  describe("User Repository (Global)", () => {
    it("should manage global users", async () => {
      const fetchedByEmail = await userRepo.getByEmail("userA@test.com");
      expect(fetchedByEmail?.id).toBe(userA.id);

      const fetchedById = await userRepo.getById(userB.id);
      expect(fetchedById?.email).toBe("userB@test.com");
    });
  });

  describe("Referral Repository", () => {
    it("should isolate referrals and atomically complete with point awards", async () => {
      // customerA refers customerC in cafeA
      const referral = await referralRepo.create(cafeAId, customerA.id, customerC.id);
      expect(referral.status).toBe("PENDING");

      // Verify lists are isolated
      const listB = await referralRepo.list(cafeBId);
      expect(listB.length).toBe(0);

      const listA = await referralRepo.list(cafeAId);
      expect(listA.length).toBe(1);
      expect(listA[0].id).toBe(referral.id);

      // Try completing a referral from another cafe (should fail)
      await expect(referralRepo.complete(cafeBId, referral.id, 100)).rejects.toThrow();

      // Complete the referral atomically and verify points
      const completed = await referralRepo.complete(cafeAId, referral.id, 150);
      expect(completed.status).toBe("COMPLETED");
      expect(completed.pointsAwarded).toBe(150);

      // Verify that customerA (referrer) points were incremented
      const referrerUpdated = await customerRepo.getById(cafeAId, customerA.id);
      expect(referrerUpdated?.points).toBe(150);

      // Re-completing should fail
      await expect(referralRepo.complete(cafeAId, referral.id, 150)).rejects.toThrow();
    });
  });
});
