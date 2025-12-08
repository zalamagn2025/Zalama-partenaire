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
  async headers() {
    const csp = [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      // Scripts: allow self, inline for Next/Tailwind, and Vercel analytics
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com",
      // Styles: allow inline for Tailwind
      "style-src 'self' 'unsafe-inline'",
      // Images: allow self, data/blobs and Supabase storage
      "img-src 'self' data: blob: https://mspmrzlqhwpdkkburjiw.supabase.co",
      // Media fonts
      "font-src 'self' data:",
      // XHR/websocket connections
      "connect-src 'self' https: wss:",
      // Workers
      "worker-src 'self' blob:",
      // Objects disabled
      "object-src 'none'",
      // Prefetches
      "prefetch-src 'self'",
      // Form actions restricted to self
      "form-action 'self'",
    ].join('; ');

    const common = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), accelerometer=(), autoplay=(), fullscreen=(self)" },
      { key: 'Content-Security-Policy', value: csp },
      // Cross-Origin Isolation headers (safer defaults)
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
      // Language preference
      { key: 'Accept-Language', value: 'fr-FR,fr;q=0.9,en;q=0.8' },
    ];

    return [
      {
        source: '/(.*)',
        headers: common,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mspmrzlqhwpdkkburjiw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Redimensionnement automatique
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Améliorer la compatibilité navigateur
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons"],
  },
  // Support des navigateurs plus anciens
  transpilePackages: ["@radix-ui/react-icons"],
  // Sécurité: masquer l'en-tête X-Powered-By
  poweredByHeader: false,
  // Localisation par défaut en français
  i18n: {
    locales: ["fr"],
    defaultLocale: "fr",
  },
  // Configuration webpack pour la compatibilité
  webpack: (config, { isServer, dev }) => {
    // Supprimer console.log en production
    if (!dev && !isServer) {
      config.optimization.minimizer.forEach((minimizer: any) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              ...minimizer.options.terserOptions?.compress,
              drop_console: ['log'],
            },
          };
        }
      });
    }

    // Support des formats vidéo avec fallbacks
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/videos/",
          outputPath: "static/videos/",
        },
      },
    });

    // Support des formats audio
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/audio/",
          outputPath: "static/audio/",
        },
      },
    });

    return config;
  },
};

export default withPWAConfigured(nextConfig);
