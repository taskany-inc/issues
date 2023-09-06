import type { AppProps, NextWebVitalsMetric } from 'next/app';
import '../utils/wdyr';
import { PageLoadProgress } from '@taskany/bricks';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { usePageLoad } from '../hooks/usePageLoad';
import { trpc } from '../utils/trpcClient';
import { TLocale, setSSRLocale } from '../utils/getLang';
import { GoalPreviewProvider } from '../components/GoalPreview/GoalPreviewProvider';
import { getTelemetryInstanceSingleton, useWebTelemetryMonitoringInit } from '../utils/telemetry';

const defaultThemes = ['light', 'dark'];
const defaultGrid = {
    paddingWidth: {
        xs: 0,
        sm: 0,
        md: 0,
        lg: 0,
        xl: 0,
    },
    gutterWidth: {
        xs: 0,
        sm: 0,
        md: 0,
        lg: 0,
        xl: 0,
    },
    columns: {
        xs: 24,
        sm: 24,
        md: 24,
        lg: 24,
        xl: 24,
    },
};

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
                <StyledThemeProvider theme={{ awesomegrid: defaultGrid }}>
                    <ThemeProvider themes={defaultThemes}>
                        <GoalPreviewProvider>
                            <PageLoadProgress height={2} ref={pageLoadRef} />
                            <Component {...pageProps} />
                            <ReactQueryDevtools />
                        </GoalPreviewProvider>
                    </ThemeProvider>
                </StyledThemeProvider>
            </SessionProvider>
        </>
    );
};

export default trpc.withTRPC(App);
