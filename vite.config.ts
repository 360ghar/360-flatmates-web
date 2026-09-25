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
        "favicon-192.webp",
        "favicon-512.webp",
        "favicon-192-maskable.webp",
        "favicon-512-maskable.webp",
        "og-image.webp",
        "logo.webp",
        "favicon.ico",
        "llms.txt",
        "screenshots/landing-wide.webp",
        "screenshots/discover-wide.webp",
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
            src: "favicon-192.webp",
            sizes: "192x192",
            type: "image/webp",
            purpose: "any",
          },
          {
            src: "favicon-512.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "any",
          },
          {
            src: "favicon-192-maskable.webp",
            sizes: "192x192",
            type: "image/webp",
            purpose: "maskable",
          },
          {
            src: "favicon-512-maskable.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/landing-wide.webp",
            sizes: "1280x633",
            type: "image/webp",
            form_factor: "wide",
            label: "Landing page with compatibility matching overview",
          },
          {
            src: "screenshots/discover-wide.webp",
            sizes: "1280x633",
            type: "image/webp",
            form_factor: "wide",
            label: "Discover verified rooms across India",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
        globPatterns: ["**/*.{js,css,html,svg,webp,ico,woff,woff2,ttf}"],
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
        ],
      },
    }),
    /* Defer the main CSS bundle so it does not block rendering.
       Critical inline CSS in index.html handles above-the-fold styles.
       The media="print" trick downloads the CSS without blocking, then
       swaps to media="all" on load. A <noscript> fallback preserves
       the standard render-blocking behaviour when JS is disabled. */
    {
      name: "defer-main-css",
      enforce: "post",
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet"([^>]*?)>/g,
          (match, attrs) => {
            const noscriptFallback = `<noscript><link rel="stylesheet"${attrs}></noscript>`;
            const deferred = `<link rel="stylesheet"${attrs} media="print" onload="this.media='all'">`;
            return deferred + noscriptFallback;
          },
        );
      },
    },
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
