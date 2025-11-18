import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // React Compiler vorübergehend deaktiviert, da er Chunk-Loading-Probleme verursacht
  // reactCompiler: true,
  // Standalone output für Docker (nur in Production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  // Webpack config für besseres Hot Reload in Docker
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      poll: 1000, // Prüfe alle 1000ms auf Änderungen (wichtig für Docker auf Windows)
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
