import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as menuItemRepo from "@/lib/repositories/menuItem";
import { generateTableQRPack } from "@/lib/services/qrGenerator";

const MENU_TEMPLATES: Record<string, { name: string; price: number; category: string }[]> = {
  coffee: [
    { name: "House Espresso", price: 12000, category: "beverages" },
    { name: "Cappuccino", price: 22000, category: "beverages" },
    { name: "Croissant", price: 15000, category: "food" },
  ],
  chai: [
    { name: "Masala Chai", price: 8000, category: "beverages" },
    { name: "Cutting Chai", price: 6000, category: "beverages" },
    { name: "Samosa", price: 6000, category: "food" },
  ],
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, template = "coffee", tablesCount = 10 } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  const existing = await db.cafe.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const cafe = await db.cafe.create({ data: { name, slug } });
  const items = MENU_TEMPLATES[template] || MENU_TEMPLATES.coffee;
  for (const item of items) {
    await menuItemRepo.create(cafe.id, { ...item, isAvailable: true });
  }

  const pdf = await generateTableQRPack(cafe.id, tablesCount, name, slug, "localhost");

  return new NextResponse(new Uint8Array(pdf), {
    status: 201,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qr_pack_${slug}.pdf"`,
    },
  });
}
