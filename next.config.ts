import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old destinations page now lives inside /trips (named "Destinations").
  async redirects() {
    return [
      { source: "/destinations", destination: "/trips", permanent: true },
      // Short ways into the CMS.
      { source: "/login", destination: "/admin/login", permanent: false },
      { source: "/cms", destination: "/admin", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
