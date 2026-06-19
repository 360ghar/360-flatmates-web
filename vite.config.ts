import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "robots.txt",
        "sitemap.xml",
        "favicon-192.png",
        "favicon-512.png",
        "favicon-192-maskable.png",
        "favicon-512-maskable.png",
        "og-image.png",
        "logo.png",
        "favicon.ico",
        "llms.txt",
        "screenshots/landing-wide.png",
        "screenshots/discover-wide.png",
      ],
      manifest: {
        name: "360 Flatmates",
        short_name: "360 Flatmates",
        description: "Find compatible flatmates and verified rooms across India.",
        categories: ["lifestyle", "social", "productivity"],
        theme_color: "#F4F3EE",
        background_color: "#F4F3EE",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "favicon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "favicon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "favicon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "favicon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/landing-wide.png",
            sizes: "1280x633",
            type: "image/png",
            form_factor: "wide",
            label: "Landing page with compatibility matching overview",
          },
          {
            src: "screenshots/discover-wide.png",
            sizes: "1280x633",
            type: "image/png",
            form_factor: "wide",
            label: "Discover verified rooms across India",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff,woff2,ttf}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "app-shell",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            method: "GET",
            options: {
              cacheName: "api",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 5,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://api.360ghar.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/app/v1"),
      },
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router/")) return "vendor";
          if (id.includes("node_modules/@tanstack/")) return "query";
          if (id.includes("node_modules/framer-motion")) return "framer-motion";
        },
      },
    },
  },
});
