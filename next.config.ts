import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 opens data/apt-defect.sqlite via a raw fs path, which
  // Next.js can't statically trace as a route dependency — without this,
  // Vercel's serverless bundle omits the file and every DB read 500s.
  outputFileTracingIncludes: {
    "/**": ["./data/apt-defect.sqlite"],
  },
};

export default nextConfig;
