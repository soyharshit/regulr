import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as menuItemRepo from "@/lib/repositories/menuItem";
import * as userRepo from "@/lib/repositories/user";

const MENU_TEMPLATES: Record<string, { name: string; price: number; category: string }[]> = {
  coffee: [
    { name: "House Espresso", price: 12000, category: "beverages" },
    { name: "Cappuccino", price: 22000, category: "beverages" },
    { name: "Cafe Latte", price: 24000, category: "beverages" },
    { name: "Croissant", price: 15000, category: "food" },
    { name: "Chocolate Muffin", price: 13000, category: "food" },
  ],
  chai: [
    { name: "Masala Chai", price: 8000, category: "beverages" },
    { name: "Cutting Chai", price: 6000, category: "beverages" },
    { name: "Filter Coffee", price: 9000, category: "beverages" },
    { name: "Samosa", price: 6000, category: "food" },
    { name: "Vada Pav", price: 7000, category: "food" },
  ],
};

function generateTempPassword(): string {
  // 9-char human-friendly password, e.g. "a7Kq2Rf9x1"
  return randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 9) + "1";
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, template = "coffee", tablesCount = 10, ownerEmail, city, address } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const normalizedSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const existing = await db.cafe.findUnique({ where: { slug: normalizedSlug } });
  if (existing) {
    return NextResponse.json({ error: "That slug is already taken" }, { status: 409 });
  }

  // Create the cafe + starter menu + default loyalty settings.
  const cafe = await db.cafe.create({ data: { name, slug: normalizedSlug } });

  const items = MENU_TEMPLATES[template] || MENU_TEMPLATES.coffee;
  for (const item of items) {
    await menuItemRepo.create(cafe.id, { ...item, isAvailable: true });
  }

  await db.cafeSettings.create({
    data: {
      cafeId: cafe.id,
      loyaltyEnabled: true,
      pointsPerRupee: 1,
      streakMilestones: JSON.stringify([3, 7, 14, 30]),
      coupons: JSON.stringify([{ code: "WELCOME10", discountPercent: 10, maxUses: 500 }]),
    },
  });

  // Provision an owner login for the cafe.
  let owner: { email: string; tempPassword: string } | null = null;
  if (ownerEmail) {
    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    await userRepo.upsertOwner({
      email: String(ownerEmail).toLowerCase(),
      name: `${name} Owner`,
      hashedPassword: hashed,
      cafeId: cafe.id,
    });
    owner = { email: String(ownerEmail).toLowerCase(), tempPassword };
  }

  // Audit the action.
  await db.auditLog.create({
    data: {
      actorId: (session.user as { id?: string }).id || "unknown",
      targetId: cafe.id,
      action: "CAFE_ONBOARDED",
      metadata: JSON.stringify({ slug: normalizedSlug, name, city, address, tablesCount, ownerEmail: ownerEmail || null }),
    },
  });

  return NextResponse.json(
    {
      cafe: { id: cafe.id, name: cafe.name, slug: cafe.slug },
      storefrontPath: `/store/${cafe.slug}`,
      qrPackPath: `/api/admin/qr?slug=${cafe.slug}&tables=${tablesCount}`,
      owner,
    },
    { status: 201 }
  );
}
