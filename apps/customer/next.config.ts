import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "digishop.blob.core.windows.net",
        pathname: "/digishop-production/**",
      },
    ],
  },
}

export default nextConfig
