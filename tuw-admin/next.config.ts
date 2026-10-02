import type { NextConfig } from 'next';

// Mirrors E:\Unplugged\next.config.mjs redirects for identical routing behavior.
// Note: '/' -> '/login' is also handled by src/app/page.tsx (verbatim old port).
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/home',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/homepage',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
