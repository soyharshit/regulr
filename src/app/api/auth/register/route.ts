import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import * as userRepo from "@/lib/repositories/user";
import * as customerRepo from "@/lib/repositories/customer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Self-serve customer registration. Creates a CUSTOMER user and, when a cafe
// slug is supplied (from the storefront), a loyalty profile at that cafe so
// points start accruing on the very first order.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = body.name ? String(body.name).trim() : null;
  const slug = body.slug ? String(body.slug).trim() : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await userRepo.getByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepo.createCustomerUser({ email, name, hashedPassword });

  // Link a loyalty profile for the cafe they signed up from.
  if (slug) {
    const cafe = await db.cafe.findUnique({ where: { slug } });
    if (cafe) {
      await customerRepo.findOrCreateForUser(cafe.id, user.id);
    }
  }

  return NextResponse.json({ ok: true, email });
}
