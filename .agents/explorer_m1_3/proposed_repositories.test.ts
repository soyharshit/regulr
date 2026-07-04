import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { menuItemRepository } from '@/lib/repositories/menuItem';
import { orderRepository } from '@/lib/repositories/order';
import { customerRepository } from '@/lib/repositories/customer';
import { referralRepository } from '@/lib/repositories/referral';

// Test variables to store generated IDs
let cafeAId: string;
let cafeBId: string;
let userAId: string;
let userBId: string;
let customerAId: string;
let customerBId: string;
let itemAId: string;
let itemBId: string;
let orderAId: string;
let orderBId: string;
let referralAId: string;

async function clearDatabase() {
  // Clear tables in dependency order to prevent foreign key constraint violations
  const tableNames = ['Referral', 'Order', 'MenuItem', 'Customer', 'User', 'Cafe'];
  for (const tableName of tableNames) {
    try {
      await db.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
    } catch (e) {
      // Ignore if table does not exist yet (e.g. before schema extensions)
    }
  }
}

async function seedTestData() {
  // 1. Create Cafes
  const cafeA = await db.cafe.create({
    data: { name: 'Cafe Alpha', slug: 'alpha' },
  });
  cafeAId = cafeA.id;

  const cafeB = await db.cafe.create({
    data: { name: 'Cafe Beta', slug: 'beta' },
  });
  cafeBId = cafeB.id;

  // 2. Create Users
  const userA = await db.user.create({
    data: { email: 'user.a@regulr.in', name: 'User A', role: 'CUSTOMER' },
  });
  userAId = userA.id;

  const userB = await db.user.create({
    data: { email: 'user.b@regulr.in', name: 'User B', role: 'CUSTOMER' },
  });
  userBId = userB.id;

  // 3. Create Customers (associated with specific cafes)
  const customerA = await db.customer.create({
    data: { cafeId: cafeAId, userId: userAId, points: 100 },
  });
  customerAId = customerA.id;

  const customerB = await db.customer.create({
    data: { cafeId: cafeBId, userId: userBId, points: 200 },
  });
  customerBId = customerB.id;

  // 4. Create MenuItems
  const itemA = await db.menuItem.create({
    data: { cafeId: cafeAId, name: 'Alpha Espresso', price: 25000 },
  });
  itemAId = itemA.id;

  const itemB = await db.menuItem.create({
    data: { cafeId: cafeBId, name: 'Beta Latte', price: 30000 },
  });
  itemBId = itemB.id;

  // 5. Create Orders
  const orderA = await db.order.create({
    data: { cafeId: cafeAId, totalAmount: 50000, status: 'PENDING' },
  });
  orderAId = orderA.id;

  const orderB = await db.order.create({
    data: { cafeId: cafeBId, totalAmount: 75000, status: 'PENDING' },
  });
  orderBId = orderB.id;

  // 6. Create Referrals (using a separate referred user)
  const referredUserA = await db.user.create({
    data: { email: 'referred.a@regulr.in', name: 'Referred A' },
  });
  const referralA = await db.referral.create({
    data: {
      cafeId: cafeAId,
      referrerId: customerAId,
      referredId: referredUserA.id,
      completed: false,
    },
  });
  referralAId = referralA.id;
}

beforeAll(async () => {
  await clearDatabase();
});

beforeEach(async () => {
  await clearDatabase();
  await seedTestData();
});

describe('Repository Layer - Tenant Isolation Verification', () => {
  
  describe('MenuItemRepository', () => {
    it('should list only items belonging to the requested cafe', async () => {
      const items = await menuItemRepository.list(cafeAId);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(itemAId);
      expect(items[0].name).toBe('Alpha Espresso');
    });

    it('should get an item by ID only if it belongs to the requested cafe', async () => {
      // Correct tenant query
      const item = await menuItemRepository.getById(cafeAId, itemAId);
      expect(item).not.toBeNull();
      expect(item?.id).toBe(itemAId);

      // Cross-tenant query (Cafe A trying to read Cafe B's item)
      const crossItem = await menuItemRepository.getById(cafeAId, itemBId);
      expect(crossItem).toBeNull();
    });

    it('should create an item linked to the correct cafe', async () => {
      const newItem = await menuItemRepository.create(cafeAId, {
        name: 'Alpha Cappuccino',
        price: 28000,
      });
      expect(newItem.cafeId).toBe(cafeAId);

      const bItems = await menuItemRepository.list(cafeBId);
      expect(bItems.find(i => i.id === newItem.id)).toBeUndefined();
    });

    it('should prevent updating an item belonging to another cafe', async () => {
      // Cafe A trying to update Cafe B's item
      await expect(
        menuItemRepository.update(cafeAId, itemBId, { name: 'Hacked Title', price: 99000 })
      ).rejects.toThrow();

      // Verify Cafe B's item was NOT changed in the database
      const originalItemB = await db.menuItem.findUnique({ where: { id: itemBId } });
      expect(originalItemB?.name).toBe('Beta Latte');
      expect(originalItemB?.price).toBe(30000);
    });

    it('should prevent deleting an item belonging to another cafe', async () => {
      // Cafe A trying to delete Cafe B's item
      await expect(
        menuItemRepository.delete(cafeAId, itemBId)
      ).rejects.toThrow();

      // Verify Cafe B's item still exists in the database
      const itemBExists = await db.menuItem.findUnique({ where: { id: itemBId } });
      expect(itemBExists).not.toBeNull();
    });
  });

  describe('OrderRepository', () => {
    it('should list only orders belonging to the requested cafe', async () => {
      const orders = await orderRepository.list(cafeAId);
      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe(orderAId);
    });

    it('should get an order by ID only if it belongs to the requested cafe', async () => {
      const order = await orderRepository.getById(cafeAId, orderAId);
      expect(order).not.toBeNull();
      expect(order?.id).toBe(orderAId);

      // Cross-tenant query
      const crossOrder = await orderRepository.getById(cafeAId, orderBId);
      expect(crossOrder).toBeNull();
    });

    it('should create an order linked to the correct cafe', async () => {
      const newOrder = await orderRepository.create(cafeAId, {
        totalAmount: 42000,
        status: 'PENDING',
      });
      expect(newOrder.cafeId).toBe(cafeAId);

      const bOrders = await orderRepository.list(cafeBId);
      expect(bOrders.find(o => o.id === newOrder.id)).toBeUndefined();
    });

    it('should prevent updating status of an order belonging to another cafe', async () => {
      // Cafe A trying to update status of Cafe B's order
      await expect(
        orderRepository.updateStatus(cafeAId, orderBId, 'COMPLETED')
      ).rejects.toThrow();

      // Verify Cafe B's order status remains PENDING
      const originalOrderB = await db.order.findUnique({ where: { id: orderBId } });
      expect(originalOrderB?.status).toBe('PENDING');
    });
  });

  describe('CustomerRepository', () => {
    it('should retrieve customer by user ID only if they are a customer of the requested cafe', async () => {
      const customer = await customerRepository.getByUserId(cafeAId, userAId);
      expect(customer).not.toBeNull();
      expect(customer?.id).toBe(customerAId);

      // User B is at Cafe B, so searching under Cafe A must return null
      const crossCustomer = await customerRepository.getByUserId(cafeAId, userBId);
      expect(crossCustomer).toBeNull();
    });

    it('should retrieve customer by customer ID only if they belong to the requested cafe', async () => {
      const customer = await customerRepository.getById(cafeAId, customerAId);
      expect(customer).not.toBeNull();
      expect(customer?.id).toBe(customerAId);

      // Cross-tenant query
      const crossCustomer = await customerRepository.getById(cafeAId, customerBId);
      expect(crossCustomer).toBeNull();
    });

    it('should prevent updating points of a customer belonging to another cafe', async () => {
      // Cafe A trying to update points of Cafe B's customer
      await expect(
        customerRepository.updatePoints(cafeAId, customerBId, 999)
      ).rejects.toThrow();

      // Verify Cafe B's customer points remain unchanged
      const originalCustomerB = await db.customer.findUnique({ where: { id: customerBId } });
      expect(originalCustomerB?.points).toBe(200);
    });
  });

  describe('ReferralRepository', () => {
    it('should list only referrals belonging to the requested cafe', async () => {
      const referrals = await referralRepository.list(cafeAId);
      expect(referrals).toHaveLength(1);
      expect(referrals[0].id).toBe(referralAId);
    });

    it('should prevent completing a referral belonging to another cafe', async () => {
      // Create a referral under Cafe B
      const referredUserB = await db.user.create({
        data: { email: 'referred.b@regulr.in', name: 'Referred B' },
      });
      const referralB = await db.referral.create({
        data: {
          cafeId: cafeBId,
          referrerId: customerBId,
          referredId: referredUserB.id,
          completed: false,
        },
      });

      // Cafe A tries to complete Cafe B's referral
      await expect(
        referralRepository.complete(cafeAId, referralB.id, 500)
      ).rejects.toThrow();

      // Verify Cafe B's referral is still incomplete
      const originalReferralB = await db.referral.findUnique({ where: { id: referralB.id } });
      expect(originalReferralB?.completed).toBe(false);
      expect(originalReferralB?.pointsAwarded).toBe(0);
    });
  });
});
