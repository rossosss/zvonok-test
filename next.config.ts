import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://uploadthing.com')
    ]
  },
  reactCompiler: true,
};

export default nextConfig;
