/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = withBundleAnalyzer({
    reactStrictMode: process.env.STRICT_MODE,
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

        config.resolve = {
            ...config.resolve,
            alias: {
                ...config.resolve.alias,
                react: path.resolve(__dirname, 'node_modules/react'),
                'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
                'styled-components': path.resolve(__dirname, 'node_modules/styled-components'),
            },
        };

        return config;
    },
});

module.exports = nextConfig;
