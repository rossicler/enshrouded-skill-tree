/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BASE_URL: process.env.BASE_URL,
  },
  i18n: {
    locales: ['en', 'fr'], // Supported locales
    defaultLocale: 'en',   // Default language
  },
};

export default nextConfig;
