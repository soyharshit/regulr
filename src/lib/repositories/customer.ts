import { db } from "../db";
import { Customer, Prisma } from "@prisma/client";

export async function getByUserId(cafeId: string, userId: string): Promise<Customer | null> {
  return db.customer.findUnique({
    where: {
      cafeId_userId: { cafeId, userId },
    },
    include: {
      user: true,
    },
  });
}

export async function getById(cafeId: string, id: string): Promise<Customer | null> {
  return db.customer.findFirst({
    where: { id, cafeId },
    include: {
      user: true,
    },
  });
}

export async function create(
  cafeId: string,
  data: Omit<Prisma.CustomerCreateInput, "cafe">
): Promise<Customer> {
  return db.customer.create({
    data: {
      ...data,
      cafe: { connect: { id: cafeId } },
    },
    include: {
      user: true,
    },
  });
}

export async function updatePoints(
  cafeId: string,
  id: string,
  points: number
): Promise<Customer> {
  const existing = await db.customer.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`Customer not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.customer.update({
    where: { id },
    data: { points },
  });
}

export async function list(cafeId: string) {
  return db.customer.findMany({
    where: { cafeId },
    include: { user: true, orders: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { points: "desc" },
  });
}

export async function updateTier(cafeId: string, id: string, tier: string) {
  const existing = await db.customer.findFirst({ where: { id, cafeId } });
  if (!existing) throw new Error(`Customer not found`);
  return db.customer.update({ where: { id }, data: { tier } });
}
