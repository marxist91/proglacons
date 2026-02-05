import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Définir explicitement le root pour éviter les problèmes de caractères spéciaux
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
