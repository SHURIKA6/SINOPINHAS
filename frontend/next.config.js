/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
    },
    transpilePackages: ['react-window', 'react-virtualized-auto-sizer'],
};

module.exports = nextConfig;
