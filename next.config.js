/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { withSentryConfig } = require('@sentry/nextjs');
const withPlugins = require('next-compose-plugins');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const path = require('path');

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
        widenClientFileUpload: true,
    },
    webpack(config, { dev, isServer }) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });

        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };

        if (dev && !isServer) {
            const originalEntry = config.entry;
            config.entry = async () => {
                const wdrPath = path.resolve(__dirname, './scripts/wdyr.ts');
                const entries = await originalEntry();

                if (entries['main.js'] && !entries['main.js'].includes(wdrPath)) {
                    entries['main.js'].push(wdrPath);
                }
                return entries;
            };
        }

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
    ignore: ['node_modules'],
};

module.exports = withPlugins(nextPlugins, withSentryConfig(nextConfig, SentryWebpackPluginOptions));
