import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import * as menuItemRepo from "@/lib/repositories/menuItem";
import * as orderRepo from "@/lib/repositories/order";
import * as customerRepo from "@/lib/repositories/customer";
import * as userRepo from "@/lib/repositories/user";

describe("Tenant Isolation — Cross-Cafe Boundary Tests", () => {
  let cafeXId: string;
  let cafeYId: string;
  let userX: any;
  let userY: any;
  let customerX: any;
  let customerY: any;

  beforeEach(async () => {
    await db.referral.deleteMany({});
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.menuItem.deleteMany({});
    await db.customer.deleteMany({});
    await db.user.deleteMany({});
    await db.cafe.deleteMany({});
    await db.auditLog.deleteMany({});

    const cafeX = await db.cafe.create({ data: { name: "Cafe X", slug: "cafe-x" } });
    const cafeY = await db.cafe.create({ data: { name: "Cafe Y", slug: "cafe-y" } });
    cafeXId = cafeX.id;
    cafeYId = cafeY.id;

    userX = await userRepo.create({ email: "userX@test.com", name: "User X" });
    userY = await userRepo.create({ email: "userY@test.com", name: "User Y" });

    customerX = await customerRepo.create(cafeXId, { user: { connect: { id: userX.id } } });
    customerY = await customerRepo.create(cafeYId, { user: { connect: { id: userY.id } } });
  });

  describe("MenuItem cross-tenant isolation", () => {
    it("cafe X cannot see cafe Y's menu items", async () => {
      await menuItemRepo.create(cafeXId, { name: "Item X", price: 10000 });
      await menuItemRepo.create(cafeYId, { name: "Item Y", price: 20000 });

      const listX = await menuItemRepo.list(cafeXId);
      expect(listX).toHaveLength(1);
      expect(listX[0].name).toBe("Item X");

      const listY = await menuItemRepo.list(cafeYId);
      expect(listY).toHaveLength(1);
      expect(listY[0].name).toBe("Item Y");
    });

    it("cafe X cannot fetch a menu item belonging to cafe Y", async () => {
      const itemY = await menuItemRepo.create(cafeYId, { name: "Item Y", price: 20000 });
      const fetched = await menuItemRepo.getById(cafeXId, itemY.id);
      expect(fetched).toBeNull();
    });

    it("cafe X cannot update cafe Y's menu item", async () => {
      const itemY = await menuItemRepo.create(cafeYId, { name: "Item Y", price: 20000 });
      await expect(
        menuItemRepo.update(cafeXId, itemY.id, { name: "Hijacked" })
      ).rejects.toThrow();
    });

    it("cafe X cannot delete cafe Y's menu item", async () => {
      const itemY = await menuItemRepo.create(cafeYId, { name: "Item Y", price: 20000 });
      await expect(menuItemRepo.delete(cafeXId, itemY.id)).rejects.toThrow();
    });
  });

  describe("Order cross-tenant isolation", () => {
    it("cafe X cannot see cafe Y's orders", async () => {
      await orderRepo.create(cafeXId, { totalAmount: 50000, status: "PENDING", customer: { connect: { id: customerX.id } } });
      await orderRepo.create(cafeYId, { totalAmount: 60000, status: "PENDING", customer: { connect: { id: customerY.id } } });

      const listX = await orderRepo.list(cafeXId);
      expect(listX).toHaveLength(1);

      const listY = await orderRepo.list(cafeYId);
      expect(listY).toHaveLength(1);
    });

    it("cafe X cannot fetch cafe Y's order by id", async () => {
      const orderY = await orderRepo.create(cafeYId, { totalAmount: 60000, status: "PENDING", customer: { connect: { id: customerY.id } } });
      const fetched = await orderRepo.getById(cafeXId, orderY.id);
      expect(fetched).toBeNull();
    });

    it("cafe X cannot update status of cafe Y's order", async () => {
      const orderY = await orderRepo.create(cafeYId, { totalAmount: 60000, status: "PENDING", customer: { connect: { id: customerY.id } } });
      await expect(orderRepo.updateStatus(cafeXId, orderY.id, "COMPLETED")).rejects.toThrow();
    });
  });

  describe("Customer cross-tenant isolation", () => {
    it("cafe X cannot fetch cafe Y's customer", async () => {
      const fetched = await customerRepo.getById(cafeXId, customerY.id);
      expect(fetched).toBeNull();
    });

    it("cafe X cannot update points of cafe Y's customer", async () => {
      await expect(customerRepo.updatePoints(cafeXId, customerY.id, 100)).rejects.toThrow();
    });

    it("cafe X can read and update its own customer", async () => {
      const updated = await customerRepo.updatePoints(cafeXId, customerX.id, 75);
      expect(updated.points).toBe(75);
    });
  });
});
