import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/uploads/:id", destination: `${API_URL}/api/uploads/:id` }];
  },
};

export default nextConfig;
