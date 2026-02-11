import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Katalara - Platform Manajemen Bisnis UMKM",
  description: "Platform all-in-one untuk mengelola keuangan, inventori, dan operasional bisnis UMKM Anda dengan mudah dan efisien",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: 'https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png',
    apple: 'https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png',
  },
};

// Ensure responsive behavior on mobile devices
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
  themeColor: '#1088ff',
};

// Ensure env is read at runtime (important on Vercel when env vars are added/changed after a deployment).
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimePublicEnv = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png" />
        <link rel="apple-touch-icon" href="https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/*
          Runtime-inject public env so client code can read it without relying on build-time replacement.
          This helps when a Vercel deployment was built before env vars were configured.
        */}
        <Script
          id="katalara-runtime-public-env"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__KATALARA_PUBLIC_ENV__=${JSON.stringify(runtimePublicEnv)};`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
