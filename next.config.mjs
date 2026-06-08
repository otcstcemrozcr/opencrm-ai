/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2", "postgres", "@react-pdf/renderer"],
  },
};

export default nextConfig;
