import type { AppProps } from 'next/app';
import '../utils/wdyr';
import { PageLoadProgress } from '@taskany/bricks';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { usePageLoad } from '../hooks/usePageLoad';
import { trpc } from '../utils/trpcClient';
import { TLocale, setSSRLocale } from '../utils/getLang';
import { GoalPreviewProvider } from '../components/GoalPreview/GoalPreviewProvider';

const defaultThemes = ['light', 'dark'];

const App = ({ Component, pageProps, router }: AppProps) => {
    setSSRLocale(router.locale as TLocale);

    const pageLoadRef = usePageLoad(router);

    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
                <ThemeProvider themes={defaultThemes}>
                    <GoalPreviewProvider>
                        <PageLoadProgress height={2} ref={pageLoadRef} />
                        <Component {...pageProps} />
                        <ReactQueryDevtools />
                    </GoalPreviewProvider>
                </ThemeProvider>
            </SessionProvider>
        </>
    );
};

export default trpc.withTRPC(App);
