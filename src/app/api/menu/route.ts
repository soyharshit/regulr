import { NextRequest, NextResponse } from 'next/server';
import * as menuItemRepo from '@/lib/repositories/menuItem';
import * as cafeRepo from '@/lib/repositories/cafe';

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
  try {
    const body = await request.json();
    const { cafeId, name, price, category, description, isAvailable = true } = body;
    if (!cafeId || !name || price == null) {
      return NextResponse.json({ error: 'cafeId, name, and price required' }, { status: 400 });
    }
    const item = await menuItemRepo.create(cafeId, {
      name,
      price: Number(price),
      category: category || 'beverages',
      description: description || null,
      isAvailable: Boolean(isAvailable),
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cafeId, id, ...data } = body;
    if (!cafeId || !id) {
      return NextResponse.json({ error: 'cafeId and id required' }, { status: 400 });
    }
    const item = await menuItemRepo.update(cafeId, id, data);
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const cafeId = request.nextUrl.searchParams.get('cafeId');
  const id = request.nextUrl.searchParams.get('id');
  if (!cafeId || !id) {
    return NextResponse.json({ error: 'cafeId and id required' }, { status: 400 });
  }
  try {
    await menuItemRepo.delete(cafeId, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
