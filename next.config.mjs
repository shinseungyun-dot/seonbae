/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production builds from overwriting assets used by a running dev server.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
};

export default nextConfig;
