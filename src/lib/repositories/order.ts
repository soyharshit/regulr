import { db } from "../db";
import { Order } from "@prisma/client";

export async function list(cafeId: string): Promise<Order[]> {
  return db.order.findMany({
    where: { cafeId },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      customer: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(cafeId: string, id: string): Promise<Order | null> {
  return db.order.findFirst({
    where: { id, cafeId },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      customer: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function getByIdPublic(id: string): Promise<Order | null> {
  return db.order.findUnique({
    where: { id },
    include: { orderItems: { include: { menuItem: true } } },
  });
}

export async function create(
  cafeId: string,
  data: any
): Promise<Order> {
  if (data.customer?.connect?.id) {
    const cust = await db.customer.findFirst({
      where: { id: data.customer.connect.id, cafeId }
    });
    if (!cust) throw new Error("Customer not found or unauthorized for this cafe");
  }

  if (data.orderItems?.create) {
    const items = Array.isArray(data.orderItems.create) ? data.orderItems.create : [data.orderItems.create];
    for (const item of items) {
      if (item.menuItem?.connect?.id) {
        const m = await db.menuItem.findFirst({
          where: { id: item.menuItem.connect.id, cafeId }
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
    include: {
      orderItems: true,
    },
  });
}

export async function updateStatus(
  cafeId: string,
  id: string,
  status: string
): Promise<Order> {
  const existing = await db.order.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`Order not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.order.update({
    where: { id },
    data: { status },
    include: {
      orderItems: true,
    },
  });
}
