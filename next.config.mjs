import nextI18NextConfig from './next-i18next.config.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@enshrouded/core", "@enshrouded/react"],
  env: {
    BASE_URL: process.env.BASE_URL,
  },
  i18n: nextI18NextConfig.i18n,
  // serverSideTranslations reads its config and the locale files from disk at
  // request time. Next 16 no longer traces them, so hosts that deploy only
  // traced files (Amplify) answered every server-rendered page with a 500.
  outputFileTracingIncludes: {
    "/*": ["./next-i18next.config.js", "./public/locales/**/*.json"],
  },
  // `next dev` would otherwise write an AGENTS.md; agent guidance lives in CLAUDE.md.
  agentRules: false,
};

export default nextConfig;
