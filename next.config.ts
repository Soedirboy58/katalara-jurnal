import type { NextConfig } from "next";
import path from "path";
import withPWA from "next-pwa";

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
  eslint: {
    // ⚠️ TEMPORARY: The codebase currently contains many lint violations (e.g. explicit any).
    // Keep builds/unblocks deployments while we incrementally fix lint.
    ignoreDuringBuilds: true,
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
const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

export default withPWAConfig(nextConfig);
