import { db } from "../db";
import { Order, Prisma } from "@prisma/client";

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
  data: Omit<Prisma.OrderCreateInput, "cafe">
): Promise<Order> {
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
