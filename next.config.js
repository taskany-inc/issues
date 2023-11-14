/* eslint-disable global-require */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const { withSentryConfig } = require('@sentry/nextjs');
const path = require('path');
const withMDX = require('@next/mdx')({
    extension: /\.mdx?$/,
    options: {
        // If you use remark-gfm, you'll need to use next.config.mjs
        // as the package is ESM only
        // https://github.com/remarkjs/remark-gfm#install
        remarkPlugins: [],
        rehypePlugins: [],
        providerImportSource: '@mdx-js/react',
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        instrumentationHook: true,
    },
    compiler: {
        styledComponents: {
            ssr: true,
        },
    },
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone',
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

        if (process.env.NEXT_PUBLIC_WDYR === '1' && dev && !isServer) {
            const originalEntry = config.entry;
            config.entry = async () => {
                const wdrPath = path.resolve(__dirname, './src/utils/wdyr.ts');
                const entries = await originalEntry();

                if (entries['main.js'] && !entries['main.js'].includes(wdrPath)) {
                    entries['main.js'].push(wdrPath);
                }
                return entries;
            };

            config.resolve.alias = {
                ...config.resolve.alias,
                react: path.resolve(__dirname, 'node_modules', 'react'),
                'react-dom': path.resolve(__dirname, 'node_modules', 'react-dom'),
                'styled-components': path.resolve(__dirname, 'node_modules', 'styled-components'),
            };
        }

        if (process.env.ANALYZE === 'true') {
            const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;
            config.plugins.push(new StatoscopeWebpackPlugin());
        }

        if (!dev && !isServer && !process.env.INCLUDE_SCRIPTS_TO_MAIN_BUNDLE) {
            config.externals = {
                React: 'react',
                ReactDOM: 'react-dom',
            };
        }

        return config;
    },
};

const configWithPlugins = withMDX(nextConfig);

module.exports =
    process.env.ANALYZE === 'true'
        ? require('@next/bundle-analyzer')({})(configWithPlugins)
        : withSentryConfig(configWithPlugins, {
              silent: true,
              hideSourcemaps: true,
              ignore: ['node_modules'],
          });
