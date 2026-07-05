import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await getBySlug(slug);

  if (!cafe) {
    notFound();
  }

  return <CheckoutClient cafe={cafe} />;
}
