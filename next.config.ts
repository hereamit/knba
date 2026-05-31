import type { NextConfig } from "next";

const productionImageHost = process.env.NEXT_PUBLIC_MEDIA_HOST;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      ...(productionImageHost
        ? [
            {
              protocol: "https" as const,
              hostname: productionImageHost,
              pathname: "/media/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
