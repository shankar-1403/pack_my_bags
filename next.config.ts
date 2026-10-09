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
    // Firebase App Hosting does not run Next's image optimiser, so a custom loader picks a right-sized copy:
    // Unsplash resizes on request, and CMS uploads have smaller copies stored beside them.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
