import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCafeForSession } from "@/lib/repositories/cafe";

// Returns the cafe the signed-in user belongs to (owner's cafe, customer's
// primary cafe, or superadmin's impersonated cafe). Used to route users after login.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ slug: null }, { status: 200 });

  const cafe = await resolveCafeForSession(session, null);
  return NextResponse.json({ slug: cafe?.slug ?? null });
}
