/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false, // Desabilitar minificação SWC para evitar crashes obscuros
    env: {
        // Força a exposição da variável para o build
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
    images: {
        unoptimized: true, // Evita erros com Image Optimization sem configuração
    },
};

module.exports = nextConfig;
