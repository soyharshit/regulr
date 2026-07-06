import { notFound } from 'next/navigation';
import { getBySlug } from '@/lib/repositories/cafe';
import * as cafeSettingsRepo from '@/lib/repositories/cafeSettings';
import CheckoutClient from './CheckoutClient';

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await getBySlug(slug);

  if (!cafe) {
    notFound();
  }

  // 哈什特·什里瓦斯塔夫
  const settings = await cafeSettingsRepo.getByCafeId(cafe.id);

  return <CheckoutClient cafe={cafe} gstRate={settings.gstRate} />;
}
