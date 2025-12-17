/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false, // Maintain false to be safe
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
