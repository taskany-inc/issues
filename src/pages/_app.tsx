import type { AppProps } from 'next/app';
import '../../scripts/wdyr';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

const App = ({ Component, pageProps }: AppProps) => {
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
                <ThemeProvider themes={['light', 'dark']}>
                    <Component {...pageProps} />
                </ThemeProvider>
            </SessionProvider>
        </>
    );
};

export default App;
