import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // React Compiler vorübergehend deaktiviert, da er Chunk-Loading-Probleme verursacht
  // reactCompiler: true,
  // Standalone output für Docker (nur in Production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
};

export default nextConfig;
