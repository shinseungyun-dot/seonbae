/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production builds from overwriting assets used by a running dev server.
  // Vercel's Next.js runtime expects the conventional `.next` directory.
  distDir: process.env.VERCEL
    ? ".next"
    : process.env.NODE_ENV === "production"
      ? ".next-build"
      : ".next",
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/index.html",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/portal/meeting/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://source.zoom.us",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://source.zoom.us https://*.zoom.us blob:",
              "connect-src 'self' https://zoom.us https://*.zoom.us wss://*.zoom.us",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com https://source.zoom.us",
              "frame-src 'self' https://*.zoom.us",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self)",
          },
        ],
      },
    ];
  },
  webpack(config) {
    // Zoom 6.2 references its private download manager in the UMD bundle even
    // though that module is not published to npm. The classroom does not use
    // Zoom's file-download feature, so keep that optional branch disabled.
    config.resolve.alias["@zoom/download-manager"] = false;
    return config;
  },
};

export default nextConfig;
