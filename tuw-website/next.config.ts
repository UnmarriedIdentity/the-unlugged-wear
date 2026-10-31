import type { NextConfig } from 'next';

// Configure when the Next.js application is initialized.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/products/oversized-architectural-heavyweight-french-terry-drop-shoulder-zip-hoodie',
        destination: '/products/acid-wash-hoodie',
        permanent: true,
      },
      // One URL per page: legacy duplicates redirect to the canonical route.
      { source: '/faqs', destination: '/faq', permanent: true },
      { source: '/blog', destination: '/journal', permanent: true },
      { source: '/blog/:slug', destination: '/journal/:slug', permanent: true },
      { source: '/our-story', destination: '/about', permanent: true },
      { source: '/privacy-policy', destination: '/policies/privacy', permanent: true },
      { source: '/returns-refunds', destination: '/policies/returns', permanent: true },
      { source: '/shipping-policy', destination: '/policies/shipping', permanent: true },
      { source: '/terms', destination: '/policies/terms', permanent: true },
    ];
  },
};

export default nextConfig;
