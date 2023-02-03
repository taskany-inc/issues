/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { withSentryConfig } = require('@sentry/nextjs');
const withPlugins = require('next-compose-plugins');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

const nextPlugins = [withBundleAnalyzer];

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: process.env.STRICT_MODE,
    swcMinify: true,
    i18n: {
        locales: ['en', 'ru'],
        defaultLocale: 'en',
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    sentry: {
        disableServerWebpackPlugin: process.env.SENTRY_DISABLED === '1',
        disableClientWebpackPlugin: process.env.SENTRY_DISABLED === '1',
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/goals',
                permanent: true,
            },
        ];
    },
};

const SentryWebpackPluginOptions = {
    silent: true,
    hideSourcemaps: true,
};

module.exports = withPlugins(nextPlugins, withSentryConfig(nextConfig, SentryWebpackPluginOptions));
