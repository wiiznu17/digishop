import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    remotePatterns: [
      {
        protocal: "https",
        hostname: "digishop.blob.core.windows.net",
        pathname: "/digishop/**"
      }
    ],
  },
}
export default nextConfig;
