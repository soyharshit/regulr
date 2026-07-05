import { NextRequest, NextResponse } from 'next/server';
import * as cafeRepo from '@/lib/repositories/cafe';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const cafe = await cafeRepo.getBySlug(slug);
  if (!cafe) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(cafe);
}
