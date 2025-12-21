import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署优化：使用 standalone 输出模式
  output: "standalone",
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // Ensure puppeteer works in API routes
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
