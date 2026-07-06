import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { resolveCafeForSession } from './repositories/cafe';
import type { Cafe } from '@prisma/client';

const STAFF_ROLES = ['OWNER', 'STAFF', 'SUPERADMIN'];

export interface SessionUser {
  id?: string;
  email?: string;
  role?: string;
}

export async function getSessionUser(): Promise<{ session: unknown; user: SessionUser | undefined }> {
  const session = await getServerSession(authOptions);
  return { session, user: session?.user as SessionUser | undefined };
}

/**
 * Guard for owner/staff-scoped endpoints. Resolves the caller's cafe from the
 * SESSION (never from client-supplied cafeId) so writes are always tenant-safe.
 * Returns `{ error }` (a ready NextResponse) on failure, else `{ session, user, cafe }`.
 */
export async function requireCafe(
  requestSlug?: string | null
): Promise<{ error: NextResponse } | { session: unknown; user: SessionUser; cafe: Cafe }> {
  const { session, user } = await getSessionUser();
  if (!session || !STAFF_ROLES.includes(user?.role || '')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const cafe = await resolveCafeForSession(session, requestSlug);
  if (!cafe) {
    return { error: NextResponse.json({ error: 'Cafe not found' }, { status: 404 }) };
  }
  return { session, user: user!, cafe };
}

/** Guard for platform-only endpoints. */
export async function requireSuperadmin(): Promise<
  { error: NextResponse } | { session: unknown; user: SessionUser }
> {
  const { session, user } = await getSessionUser();
  if (!session || user?.role !== 'SUPERADMIN') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, user: user! };
}

/**
 * Decides whether the current requester may read an order's receipt/invoice.
 * Allowed: superadmin; owner/staff of the order's cafe; the customer who placed
 * it. Guest orders (no linked customer) remain reachable by id since the guest
 * has no other identity — but a customer-linked order never leaks to others.
 */
export async function canAccessOrder(order: {
  cafeId: string;
  customerId: string | null;
}): Promise<boolean> {
  const { session, user } = await getSessionUser();

  if (user?.role === 'SUPERADMIN') return true;

  if (user && (user.role === 'OWNER' || user.role === 'STAFF')) {
    const cafe = await resolveCafeForSession(session, null);
    if (cafe && cafe.id === order.cafeId) return true;
  }

  if (order.customerId && user?.id) {
    const { db } = await import('./db');
    const customer = await db.customer.findUnique({ where: { id: order.customerId } });
    if (customer && customer.userId === user.id) return true;
  }

  // Guest order — the id is the only bearer.
  if (!order.customerId) return true;

  return false;
}
