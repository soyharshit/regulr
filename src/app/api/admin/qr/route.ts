import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTableQRPack } from "@/lib/services/qrGenerator";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "SUPERADMIN" && role !== "OWNER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  const tables = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("tables")) || 10));
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) {
    return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "regulr.in";
  const pdf = await generateTableQRPack(cafe.id, tables, cafe.name, cafe.slug, rootDomain);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qr_pack_${slug}.pdf"`,
    },
  });
}
