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
};

export default nextConfig;
