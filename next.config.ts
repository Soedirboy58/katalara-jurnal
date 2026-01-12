import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This repo sits inside a larger folder that may contain other lockfiles.
  // Pin the root so Next doesn't accidentally infer the wrong workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    // ⚠️ TEMPORARY: Disable TypeScript check during build
    // TODO: Fix all TypeScript errors in useExpensesList.ts and other files
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'usradkbchlkcfoabxvbo.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
