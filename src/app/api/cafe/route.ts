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

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; cafeId?: string } | undefined;
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { brandColor, logoUrl, coverImageUrl } = body;

  const cafe = await cafeRepo.resolveCafeForSession(session);
  if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

  const updated = await db.cafe.update({
    where: { id: cafe.id },
    data: {
      brandColor: brandColor !== undefined ? brandColor : cafe.brandColor,
      logoUrl: logoUrl !== undefined ? logoUrl : cafe.logoUrl,
      coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : cafe.coverImageUrl,
    },
  });

  return NextResponse.json({ brandColor: updated.brandColor, logoUrl: updated.logoUrl, coverImageUrl: updated.coverImageUrl });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !['OWNER', 'STAFF', 'SUPERADMIN'].includes(role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cafe = await cafeRepo.resolveCafeForSession(session);
  if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const updated = await db.cafe.update({ where: { id: cafe.id }, data: { name } });
  return NextResponse.json({ id: updated.id, name: updated.name, slug: updated.slug });
}
