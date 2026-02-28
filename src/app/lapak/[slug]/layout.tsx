import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const buildBaseUrl = () => {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || '';
  const proto = headerList.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;

  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    '';

  if (!envUrl) return '';
  return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
};

const fetchStorefront = async (slug: string) => {
  const baseUrl = buildBaseUrl();
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/storefront/${slug}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.storefront || null;
  } catch {
    return null;
  }
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = buildBaseUrl();
  const storefront = await fetchStorefront(slug);

  if (!storefront) {
    return {
      title: 'Lapak',
      description: 'Lapak online',
    };
  }

  const title = storefront.store_name || 'Lapak';
  const description =
    (storefront.about_us || '').trim() ||
    (storefront.description || '').trim() ||
    `Lapak ${title}`;

  const imageUrl = storefront.logo_url || storefront.cover_image_url || null;
  const url = baseUrl ? `${baseUrl}/lapak/${slug}` : undefined;

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: title,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function LapakLayout({ children }: { children: React.ReactNode }) {
  return children;
}
