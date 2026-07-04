import { db } from "../db";
import { Referral } from "@prisma/client";

export async function list(cafeId: string): Promise<Referral[]> {
  return db.referral.findMany({
    where: { cafeId },
    include: {
      referrer: {
        include: { user: true },
      },
      referred: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function create(
  cafeId: string,
  referrerId: string,
  referredId: string
): Promise<Referral> {
  return db.referral.create({
    data: {
      cafe: { connect: { id: cafeId } },
      referrer: { connect: { id: referrerId } },
      referred: { connect: { id: referredId } },
      status: "PENDING",
    },
  });
}

export async function complete(
  cafeId: string,
  id: string,
  pointsAwarded: number
): Promise<Referral> {
  const existing = await db.referral.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`Referral not found or unauthorized for cafeId: ${cafeId}`);
  }
  if (existing.status === "COMPLETED") {
    throw new Error("Referral is already completed");
  }

  // Atomically complete the referral and increment the referrer's points
  return db.$transaction(async (tx) => {
    const referral = await tx.referral.update({
      where: { id },
      data: {
        status: "COMPLETED",
        pointsAwarded,
      },
    });

    await tx.customer.update({
      where: { id: existing.referrerId },
      data: {
        points: { increment: pointsAwarded },
      },
    });

    return referral;
  });
}
