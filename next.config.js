const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "static-font-assets" },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "static-image-assets", expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: /\/_next\/static.+\.js$/i,
      handler: "CacheFirst",
      options: { cacheName: "next-static-js-assets" },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: "CacheFirst",
      options: { cacheName: "static-audio-assets", expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        return isSameOrigin && url.pathname.startsWith("/api/");
      },
      handler: "NetworkFirst",
      options: { cacheName: "api-cache", expiration: { maxEntries: 16, maxAgeSeconds: 24 * 60 * 60 }, networkTimeoutSeconds: 10 },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        return isSameOrigin;
      },
      handler: "NetworkFirst",
      options: { cacheName: "others", expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }, networkTimeoutSeconds: 10 },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

module.exports = withPWA(nextConfig);
