import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import { listBySlug } from '@/lib/repositories/menuItem';
import StorefrontClient from './StorefrontClient';

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const cafe = await getBySlug(params.slug);
  
  if (!cafe) {
    notFound();
  }

  const menuItems = await listBySlug(params.slug);

  return <StorefrontClient cafe={cafe} menuItems={menuItems} />;
}
