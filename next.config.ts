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
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Headers pour améliorer la compatibilité
          {
            key: "Accept",
            value:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          },
          {
            key: "Accept-Encoding",
            value: "gzip, deflate, br",
          },
          {
            key: "Accept-Language",
            value: "fr-FR,fr;q=0.9,en;q=0.8",
          },
        ],
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
