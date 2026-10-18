import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sellora/shared", "@sellora/ui"],
  // Módulos con binarios nativos o que leen archivos propios: no se empaquetan.
  serverExternalPackages: ["@resvg/resvg-js", "better-sqlite3", "pg", "passkit-generator", "selfsigned"],
  turbopack: {
    root: path.resolve(import.meta.dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
