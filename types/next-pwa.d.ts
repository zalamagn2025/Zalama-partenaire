declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PWAOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    fallbacks?: Record<string, string>;
    [key: string]: unknown;
  };

  const withPWA: (options?: PWAOptions) => (nextConfig?: NextConfig) => NextConfig;
  export default withPWA;
}
