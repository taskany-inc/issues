/* eslint-disable no-console */
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
};

if (!process.env.SENTRY_DSN) {
    console.log('NextConfig: Sentry DSN is not provided via SENTRY_DSN env variable. Sentry SDK will not be included.');
}

/** @type {import('next').NextConfig} */
const nextConfig = process.env.SENTRY_DSN
    ? withSentryConfig(
          {
              ...baseConfig,
              /** @see https://github.com/getsentry/sentry-webpack-plugin#options */
              sentry: {
                  hideSourceMaps: true,
              },
          },
          {
              silent: true,
          },
      )
    : baseConfig;

module.exports = withBundleAnalyzer(nextConfig);
