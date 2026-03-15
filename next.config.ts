import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "cf.shopee.com.my" },
      { protocol: "https", hostname: "img.lazcdn.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
  },
};

export default nextConfig;
