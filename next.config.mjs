/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["googleapis", "better-sqlite3"],
  turbopack: {
    root: import.meta.dirname,
  },
}

export default nextConfig
