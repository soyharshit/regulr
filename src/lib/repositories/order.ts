import { db } from "../db";
import { Prisma } from "@prisma/client";

const withItemsAndCustomer = Prisma.validator<Prisma.OrderDefaultArgs>()({
  include: {
    orderItems: { include: { menuItem: true } },
    customer: { include: { user: true } },
  },
});

const withItems = Prisma.validator<Prisma.OrderDefaultArgs>()({
  include: { orderItems: { include: { menuItem: true } } },
});

const withPlainItems = Prisma.validator<Prisma.OrderDefaultArgs>()({
  include: { orderItems: true },
});

export type OrderWithItemsAndCustomer = Prisma.OrderGetPayload<typeof withItemsAndCustomer>;
export type OrderWithItems = Prisma.OrderGetPayload<typeof withItems>;
export type OrderWithPlainItems = Prisma.OrderGetPayload<typeof withPlainItems>;

export async function list(cafeId: string): Promise<OrderWithItemsAndCustomer[]> {
  return db.order.findMany({
    where: { cafeId },
    ...withItemsAndCustomer,
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(cafeId: string, id: string): Promise<OrderWithItemsAndCustomer | null> {
  return db.order.findFirst({
    where: { id, cafeId },
    ...withItemsAndCustomer,
  });
}

export async function getByIdPublic(id: string): Promise<OrderWithItems | null> {
  return db.order.findUnique({
    where: { id },
    ...withItems,
  });
}

export async function create(
  cafeId: string,
  data: Omit<Prisma.OrderCreateInput, "cafe">
): Promise<OrderWithPlainItems> {
  const customerConnect = (data as { customer?: { connect?: { id?: string } } }).customer?.connect?.id;
  if (customerConnect) {
    const cust = await db.customer.findFirst({
      where: { id: customerConnect, cafeId },
    });
    if (!cust) throw new Error("Customer not found or unauthorized for this cafe");
  }

  const orderItemsCreate = (data as { orderItems?: { create?: unknown } }).orderItems?.create;
  if (orderItemsCreate) {
    const items = Array.isArray(orderItemsCreate) ? orderItemsCreate : [orderItemsCreate];
    for (const item of items as { menuItem?: { connect?: { id?: string } } }[]) {
      const menuItemId = item.menuItem?.connect?.id;
      if (menuItemId) {
        const m = await db.menuItem.findFirst({
          where: { id: menuItemId, cafeId },
        });
        if (!m) throw new Error("MenuItem not found or unauthorized for this cafe");
      }
    }
  }

  return db.order.create({
    data: {
      ...data,
      cafe: { connect: { id: cafeId } },
    },
    ...withPlainItems,
  });
}

export async function updateStatus(
  cafeId: string,
  id: string,
  status: string
): Promise<OrderWithPlainItems> {
  const existing = await db.order.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`Order not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.order.update({
    where: { id },
    data: { status },
    ...withPlainItems,
  });
}
