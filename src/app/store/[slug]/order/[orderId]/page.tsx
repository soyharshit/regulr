import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import { getByIdPublic } from '@/lib/repositories/order';
import OrderTrackerClient from './OrderTrackerClient';

export default async function OrderTrackerPage({ params }: { params: Promise<{ slug: string, orderId: string }> }) {
  const { slug, orderId } = await params;
  const cafe = await getBySlug(slug);
  if (!cafe) notFound();

  const order = await getByIdPublic(orderId);
  if (!order || order.cafeId !== cafe.id) notFound();

  return <OrderTrackerClient cafe={cafe} order={order} />;
}
