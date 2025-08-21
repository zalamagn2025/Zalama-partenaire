import type { NextConfig } from "next";
import withPWA from "next-pwa";

// Initialize next-pwa with desired options
const withPWAConfigured = withPWA({
  dest: "public", // generate service worker and workbox files into public/
  disable: process.env.NODE_ENV === "development", // disable in dev to avoid caching headaches
  register: true,
  skipWaiting: true,
  fallbacks: {
    // optional: you can add offline fallbacks here later
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mspmrzlqhwpdkkburjiw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withPWAConfigured(nextConfig);
