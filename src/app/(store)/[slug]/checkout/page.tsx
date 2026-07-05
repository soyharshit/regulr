import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({ params }: { params: { slug: string } }) {
  const cafe = await getBySlug(params.slug);
  
  if (!cafe) {
    notFound();
  }

  return <CheckoutClient cafe={cafe} />;
}
