import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import * as cafeRepo from '@/lib/repositories/cafe';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const cafe = await cafeRepo.getBySlug(slug);
  if (!cafe) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(cafe);
}

// Owner (or superadmin acting for a cafe) updates their own cafe profile.
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !['OWNER', 'STAFF', 'SUPERADMIN'].includes(role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // The cafe is resolved from the session (owner's cafe / superadmin's
  // impersonated cafe), never from the request body — an owner can only ever
  // edit their own cafe.
  const cafe = await cafeRepo.resolveCafeForSession(session);
  if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const updated = await db.cafe.update({ where: { id: cafe.id }, data: { name } });
  return NextResponse.json({ id: updated.id, name: updated.name, slug: updated.slug });
}
