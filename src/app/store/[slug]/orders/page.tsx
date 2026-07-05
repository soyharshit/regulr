import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import MyOrdersClient from './MyOrdersClient';

export default async function MyOrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await getBySlug(slug);
  if (!cafe) notFound();
  return <MyOrdersClient cafe={{ id: cafe.id, name: cafe.name, slug: cafe.slug }} />;
}
