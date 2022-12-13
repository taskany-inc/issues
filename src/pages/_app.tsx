import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { NextIntlProvider } from 'next-intl';
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    if (process.env.NODE_ENV === 'production') {
        Sentry.init({
            dsn: SENTRY_DSN,
            tracesSampleRate: 1.0,
        });
    }
}

const App = ({ Component, pageProps }: AppProps) => {
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
                <NextIntlProvider messages={pageProps.i18n}>
                    <ThemeProvider themes={['light', 'dark']}>
                        <Component {...pageProps} />
                    </ThemeProvider>
                </NextIntlProvider>
            </SessionProvider>
        </>
    );
};

export default App;
