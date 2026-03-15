import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    domains: ["cdn.shopify.com", "cf.shopee.com.my", "img.lazcdn.com", "m.media-amazon.com"],
  },
};

export default nextConfig;
