import type { Metadata } from "next";
import { db } from "@/lib/db";

interface StoreLayoutProps {
  children: React.ReactNode;
  params: {
    slug: string;
  };
}

interface StoreMetadataProps {
  params: {
    slug: string;
  };
}

async function getCafe(slug: string) {
  try {
    return await db.cafe.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export async function generateMetadata({ params }: StoreMetadataProps): Promise<Metadata> {
  const cafe = await getCafe(params.slug);
  const cafeName = cafe?.name || "Regulr Cafe";

  return {
    title: `${cafeName} - Order on Regulr`,
    description: `Order directly from ${cafeName}. Skip the apps, save money, earn rewards.`,
    openGraph: {
      title: `${cafeName} - Order on Regulr`,
      description: `Order directly from ${cafeName}. Skip the apps, save money, earn rewards.`,
    },
  };
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const cafe = await getCafe(params.slug);
  const cafeName = cafe?.name || "Regulr Cafe";
  const initials = getInitials(cafeName) || "RC";

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col">
      <div className="relative w-full h-[200px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #2D1810 0%, #4A2C23 25%, #3E2118 50%, #5C3A2E 75%, #2D1810 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(255,180,100,0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(200,120,60,0.15) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-subtle to-transparent" />
      </div>

      <div className="relative -mt-[72px] mx-4 mb-0 z-10">
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-lg"
              style={{
                background: "linear-gradient(135deg, #4A2C23 0%, #6B4535 100%)",
              }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-xl text-ink leading-tight truncate">{cafeName}</h1>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="status-dot status-dot--open" />
                <span className="text-sm text-ink-2">Open - closes 11pm</span>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <div className="pill bg-bg-subtle text-ink-2 text-xs !py-1 !px-2.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1 text-ink-3"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  ~20 min
                </div>
                <div className="pill bg-teal-soft text-teal text-xs !py-1 !px-2.5 font-semibold">
                  Direct prices
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col">{children}</main>
      <div className="h-[72px]" />
    </div>
  );
}
