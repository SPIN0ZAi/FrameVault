import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Required for Prisma to bundle correctly in Cloudflare Workers
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // sharp is a native binary — not available in Workers, Next.js will skip optimisation
  images: {
    unoptimized: true,
  },
  experimental: {
    // Exclude @vercel/og (OG image generation — not used in this app) from the
    // traced file set so OpenNext won't bundle it.
    // Saves ~850 KiB gzipped, keeping the Worker under the 3 MiB free-plan limit.
    outputFileTracingExcludes: {
      '*': [
        'node_modules/next/dist/compiled/@vercel/og/**',
      ],
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://image.tmdb.org https://*.supabase.co https:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https://*.supabase.co https://api.themoviedb.org",
              "font-src 'self' data:",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// Enables Cloudflare bindings in `next dev` (no-op in production builds)
initOpenNextCloudflareForDev();
