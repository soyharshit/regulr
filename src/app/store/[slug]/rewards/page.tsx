import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import RewardsClient from './RewardsClient';

export default async function RewardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await getBySlug(slug);
  if (!cafe) notFound();
  return <RewardsClient cafe={{ name: cafe.name, slug: cafe.slug }} />;
}
