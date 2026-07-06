import { db } from "../db";
import { User, Prisma } from "@prisma/client";

export async function getByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({
    where: { email },
  });
}

export async function getById(id: string): Promise<User | null> {
  return db.user.findUnique({
    where: { id },
  });
}

export async function create(data: Prisma.UserCreateInput): Promise<User> {
  return db.user.create({
    data,
  });
}

/** Self-serve customer registration — creates a CUSTOMER user. */
export async function createCustomerUser(params: {
  email: string;
  name?: string | null;
  hashedPassword: string;
}): Promise<User> {
  return db.user.create({
    data: {
      email: params.email,
      name: params.name ?? null,
      role: "CUSTOMER",
      password: params.hashedPassword,
    },
  });
}

/**
 * Create or promote a cafe owner account. If the email already exists the user
 * is promoted to OWNER of this cafe (and optionally given a fresh password);
 * otherwise a new OWNER user is created.
 */
export async function upsertOwner(params: {
  email: string;
  name?: string | null;
  hashedPassword: string;
  cafeId: string;
}): Promise<User> {
  return db.user.upsert({
    where: { email: params.email },
    update: {
      role: "OWNER",
      cafeId: params.cafeId,
      name: params.name ?? undefined,
      password: params.hashedPassword,
    },
    create: {
      email: params.email,
      name: params.name ?? null,
      role: "OWNER",
      cafeId: params.cafeId,
      password: params.hashedPassword,
    },
  });
}
