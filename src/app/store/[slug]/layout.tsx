import type { Metadata } from 'next';
import { getBySlug } from '@/lib/repositories/cafe';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cafe = await getBySlug(slug);
  const cafeName = cafe?.name || 'Regulr';
  return {
    title: `${cafeName} — Order on Regulr`,
    description: `Order directly from ${cafeName}. Skip the apps, save money, earn rewards.`,
  };
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
