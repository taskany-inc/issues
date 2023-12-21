import type { AppProps, NextWebVitalsMetric } from 'next/app';
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
import { getTelemetryInstanceSingleton, useWebTelemetryMonitoringInit } from '../utils/telemetry';
import { ThemeSetter } from '../components/ThemeSetter';

const defaultThemes = ['light', 'dark'];

export function reportWebVitals(metric: NextWebVitalsMetric) {
    getTelemetryInstanceSingleton().then((telemetry) => {
        telemetry?.KV.push({
            key: metric.name,
            value: Math.round(metric.value),
        });
    });
}

const App = ({ Component, pageProps, router }: AppProps) => {
    setSSRLocale(router.locale as TLocale);

    const pageLoadRef = usePageLoad(router);

    useWebTelemetryMonitoringInit();

    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
                <ThemeProvider themes={defaultThemes}>
                    <ThemeSetter>
                        <GoalPreviewProvider>
                            <PageLoadProgress height={2} ref={pageLoadRef} />
                            <Component {...pageProps} />
                            <ReactQueryDevtools />
                        </GoalPreviewProvider>
                    </ThemeSetter>
                </ThemeProvider>
            </SessionProvider>
        </>
    );
};

export default trpc.withTRPC(App);
