import { NextRequest, NextResponse } from 'next/server';
import * as menuItemRepo from '@/lib/repositories/menuItem';
import * as cafeRepo from '@/lib/repositories/cafe';
import { requireCafe } from '@/lib/apiAuth';

// GET is public — the storefront lists a cafe's menu by slug.
export async function GET(request: NextRequest) {
  const cafeId = request.nextUrl.searchParams.get('cafeId');
  const slug = request.nextUrl.searchParams.get('slug');

  let resolvedCafeId = cafeId;

  if (!resolvedCafeId && slug) {
    const cafe = await cafeRepo.getBySlug(slug);
    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }
    resolvedCafeId = cafe.id;
  }

  if (!resolvedCafeId) {
    return NextResponse.json({ error: 'cafeId or slug required' }, { status: 400 });
  }

  try {
    const items = await menuItemRepo.list(resolvedCafeId);
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCafe();
  if ('error' in auth) return auth.error;
  try {
    const body = await request.json();
    const { name, price, category, description, isAvailable = true, imageUrl } = body;
    if (!name || price == null) {
      return NextResponse.json({ error: 'name and price required' }, { status: 400 });
    }
    const priceNum = Math.round(Number(price));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }
    const item = await menuItemRepo.create(auth.cafe.id, {
      name: String(name),
      price: priceNum,
      category: category || 'beverages',
      description: description || null,
      isAvailable: Boolean(isAvailable),
      imageUrl: imageUrl || null,
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireCafe();
  if ('error' in auth) return auth.error;
  try {
    const body = await request.json();
    const { id, cafeId: _ignored, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    if (data.price != null) {
      const priceNum = Math.round(Number(data.price));
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
      data.price = priceNum;
    }
    // Scope strictly to the caller's own cafe.
    const item = await menuItemRepo.update(auth.cafe.id, id, data);
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCafe();
  if ('error' in auth) return auth.error;
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  try {
    await menuItemRepo.delete(auth.cafe.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }
}
