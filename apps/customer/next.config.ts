import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    remotePatterns: [new URL('https://digishop.blob.core.windows.net/product/products/**')],
  },
}
export default nextConfig;
