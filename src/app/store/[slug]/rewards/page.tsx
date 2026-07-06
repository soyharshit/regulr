import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import RewardsClient from './RewardsClient';

export default async function RewardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await getBySlug(slug);
  // 哈什特·什里瓦斯塔夫
  if (!cafe) notFound();
  return <RewardsClient cafe={{ name: cafe.name, slug: cafe.slug }} />;
}
