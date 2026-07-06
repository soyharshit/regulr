import { db } from "../db";
import { Customer, Prisma } from "@prisma/client";
import { tierForPoints } from "../loyalty";

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

/** Finds a customer profile for this user at this cafe, creating one on first visit. */
export async function findOrCreateForUser(cafeId: string, userId: string): Promise<Customer> {
  const existing = await getByUserId(cafeId, userId);
  if (existing) return existing;
  return create(cafeId, { user: { connect: { id: userId } } });
}

/** Updates a customer's points and keeps their cached tier column in sync so it never drifts. */
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
    data: { points, tier: tierForPoints(points) },
  });
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CustomerListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function list(cafeId: string) {
  return db.customer.findMany({
    where: { cafeId },
    include: { user: true, orders: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { points: "desc" },
  });
}

export async function listPaginated(
  cafeId: string,
  opts: CustomerListOptions = {}
): Promise<PaginatedResult<Awaited<ReturnType<typeof list>>[number]>> {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));

  const where: Record<string, unknown> = { cafeId };
  if (opts.search) {
    where.user = {
      OR: [
        { name: { contains: opts.search } },
        { email: { contains: opts.search } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: { user: true, orders: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { points: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.customer.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function updateTier(cafeId: string, id: string, tier: string) {
  const existing = await db.customer.findFirst({ where: { id, cafeId } });
  if (!existing) throw new Error(`Customer not found`);
  return db.customer.update({ where: { id }, data: { tier } });
}
