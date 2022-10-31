/* eslint-disable @typescript-eslint/no-var-requires */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const { withSentryConfig } = require('@sentry/nextjs');

const baseConfig = {
    reactStrictMode: process.env.STRICT_MODE,
    swcMinify: true,
    i18n: {
        locales: ['en', 'ru'],
        defaultLocale: 'en',
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
    /** @see https://github.com/getsentry/sentry-webpack-plugin#options */
    sentry: {
        hideSourceMaps: true,
    },
};

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

/** @type {import('next').NextConfig} */
const nextConfig = SENTRY_DSN
    ? withSentryConfig(baseConfig, {
          silent: true,
      })
    : baseConfig;

module.exports = withBundleAnalyzer(nextConfig);
