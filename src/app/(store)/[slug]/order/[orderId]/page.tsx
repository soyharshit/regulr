import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import { getByIdPublic } from '@/lib/repositories/order';
import OrderTrackerClient from './OrderTrackerClient';

export default async function OrderTrackerPage({ params }: { params: { slug: string, orderId: string } }) {
  const cafe = await getBySlug(params.slug);
  if (!cafe) notFound();

  const order = await getByIdPublic(params.orderId);
  if (!order || order.cafeId !== cafe.id) notFound();

  return <OrderTrackerClient cafe={cafe} order={order} />;
}
