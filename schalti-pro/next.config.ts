import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // React Compiler vorübergehend deaktiviert, da er Chunk-Loading-Probleme verursacht
  // reactCompiler: true,
  // Standalone output für Docker (nur in Production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  // webpackDevMiddleware wurde entfernt - nicht mehr in Next.js 16 verfügbar
  // Für Development wird es nicht benötigt, da wir im Production-Build sind
};

export default nextConfig;
