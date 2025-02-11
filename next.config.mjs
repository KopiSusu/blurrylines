/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "faas-output-image.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**", // Allows all paths under this domain
      },
      {
        protocol: "https",
        hostname: "xkzhbkuzmjfwlwaurmkd.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
