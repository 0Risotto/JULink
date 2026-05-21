import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        /* * Next.js <Image /> component has a strict security policy by default.
         * To prevent malicious users from exploiting the built-in image optimization API
         * and running up server costs, Next.js blocks all external image URLs.
         * * We must explicitly "whitelist" Cloudinary's domain here in `remotePatterns`.
         * This tells Next.js: "It is safe to download, optimize, and render images
         * that come from https://res.cloudinary.com".
         */
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;