import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png" />
        <link rel="apple-touch-icon" href="https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
