import nextI18NextConfig from './next-i18next.config.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@enshrouded/core"],
  env: {
    BASE_URL: process.env.BASE_URL,
  },
  i18n: nextI18NextConfig.i18n,
  // `next dev` would otherwise write an AGENTS.md; agent guidance lives in CLAUDE.md.
  agentRules: false,
};

export default nextConfig;
