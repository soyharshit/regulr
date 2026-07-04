import { db } from "../db";
import { MenuItem, Prisma } from "@prisma/client";

export async function list(cafeId: string): Promise<MenuItem[]> {
  return db.menuItem.findMany({
    where: { cafeId },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });
}

export async function listBySlug(slug: string): Promise<MenuItem[]> {
  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return [];
  return list(cafe.id);
}

export async function getById(cafeId: string, id: string): Promise<MenuItem | null> {
  return db.menuItem.findFirst({
    where: { id, cafeId },
  });
}

export async function create(
  cafeId: string,
  data: Omit<Prisma.MenuItemCreateInput, "cafe">
): Promise<MenuItem> {
  return db.menuItem.create({
    data: {
      ...data,
      cafe: { connect: { id: cafeId } },
    },
  });
}

export async function update(
  cafeId: string,
  id: string,
  data: Omit<Prisma.MenuItemUpdateInput, "cafe">
): Promise<MenuItem> {
  const existing = await db.menuItem.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`MenuItem not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.menuItem.update({
    where: { id },
    data,
  });
}

async function _delete(cafeId: string, id: string): Promise<MenuItem> {
  const existing = await db.menuItem.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`MenuItem not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.menuItem.delete({
    where: { id },
  });
}

export { _delete as delete };
