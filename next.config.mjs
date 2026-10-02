/** @type {import('next').NextConfig} */
const nextConfig = {
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
