import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Remove outputFileTracingRoot as it's not needed in Next.js 15
  },
  env: {
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    API_URL: process.env.API_URL || 'http://localhost:80',
    NEXT_PUBLIC_API_DEV: process.env.NEXT_PUBLIC_API_DEV || 'http://localhost:8080/api',
    NEXT_PUBLIC_API_PROD: process.env.NEXT_PUBLIC_API_PROD || 'https://your-production-api.com/api',
    NEXT_PUBLIC_USE_PROD_API: process.env.NEXT_PUBLIC_USE_PROD_API || 'false',
  },
};

export default nextConfig;
