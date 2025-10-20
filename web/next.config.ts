import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Forcer HTTP/1.1 pour éviter les erreurs HTTP/2
  serverExternalPackages: ['node-fetch'],
  // Configuration pour éviter les problèmes HTTP/2
  httpAgentOptions: {
    keepAlive: false
  }
};

export default nextConfig;
