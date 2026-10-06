import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase App Hosting runs the standalone server; scripts/copy-standalone.mjs (postbuild) adds public/,
  // .next/static and content/ to it so images and assets are served.
  output: "standalone",
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
    // Firebase App Hosting does not serve Next's image optimiser (/_next/image returns 404 there), so images
    // load straight from their source. CMS uploads are already resized to WebP; Unsplash links carry a size.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
