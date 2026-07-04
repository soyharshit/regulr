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
