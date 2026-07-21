import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ai-task-platform/shared-types"],
};

export default nextConfig;
