import { db } from "@/lib/db";
import { User } from "@prisma/client";

export const userRepository = {
  /**
   * Finds a user by their unique email.
   * Note: Users are global entities in the system (unlike items/orders which are cafe-scoped).
   */
  async getByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({
      where: { email },
    });
  },

  /**
   * Finds a user by their unique database ID.
   */
  async getById(id: string): Promise<User | null> {
    return db.user.findUnique({
      where: { id },
    });
  },

  /**
   * Creates a new user record.
   */
  async create(data: { email: string; name?: string; role?: string }): Promise<User> {
    return db.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role || "CUSTOMER",
      },
    });
  },
};
