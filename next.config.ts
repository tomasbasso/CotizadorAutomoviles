import type { NextConfig } from "next";

// En GitHub Pages el sitio vive en /<repo>; el workflow define NEXT_PUBLIC_BASE_PATH. En local queda vacío.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Sitio 100% estático: `next build` genera la carpeta out/ lista para GitHub Pages.
  output: "export",
  basePath,
  images: { unoptimized: true },
  // Sin cacheComponents: activa PPR, que no funciona con output "export".
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
