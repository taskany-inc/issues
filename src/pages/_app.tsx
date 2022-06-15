import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { NextIntlProvider } from 'next-intl';

import { apolloClient } from '../utils/apolloClient';

const App = ({ Component, pageProps }: AppProps) => {
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
                <ApolloProvider client={apolloClient}>
                    <NextIntlProvider messages={pageProps.i18n}>
                        <ThemeProvider themes={['light', 'dark']} defaultTheme="dark">
                            <Component {...pageProps} />
                        </ThemeProvider>
                    </NextIntlProvider>
                </ApolloProvider>
            </SessionProvider>
        </>
    );
};

export default App;
