import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ApolloProvider } from '@apollo/client';
import { SessionProvider, useSession, signIn } from 'next-auth/react';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { NextIntlProvider } from 'next-intl';
import { GeistProvider, CssBaseline, Themes } from '@geist-ui/core';

import { Theme } from '../components/Theme';
import { apolloClient } from '../utils/apolloClient';
import { GlobalStyle } from '../components/GlobalStyle';
import { NextPageWithAuth } from '../types/nextPageWithAuth';
import { backgroundColor, toastBackgroundColor, toastTextColor } from '../design/@generated/themes';
import { useHotkeys } from '../hooks/useHotkeys';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateGoalModal } from '../components/CreateGoalModal';
import { InviteUserModal } from '../components/InviteUserModal';

type AppPropsWithAuth = AppProps & {
    Component: NextPageWithAuth;
};

const Auth = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();

    const isUser = !!session?.user;

    useEffect(() => {
        if (status === 'loading') return;
        if (!isUser) signIn();
    }, [isUser, status]);

    return isUser ? <>{children}</> : null;
};

const Root = ({ Component, pageProps }: { Component: NextPageWithAuth; pageProps: any }) => {
    const { theme } = useTheme();

    useHotkeys();

    const customGeistDarkTheme = Themes.createFromDark({
        type: 'custom-dark',
        palette: {
            background: backgroundColor,
        },
    });

    const customGeistLightTheme = Themes.createFromLight({
        type: 'custom-light',
        palette: {
            background: backgroundColor,
        },
    });

    const geistThemesMap = {
        dark: 'custom-dark',
        light: 'custom-light',
    };

    const themeType: keyof typeof geistThemesMap = theme ?? 'dark';

    return (
        <>
            <GeistProvider themes={[customGeistDarkTheme, customGeistLightTheme]} themeType={geistThemesMap[themeType]}>
                <CssBaseline />

                <GlobalStyle />

                <Theme theme={themeType} />

                <Toaster
                    toastOptions={{
                        style: { borderRadius: '6px', background: toastBackgroundColor, color: toastTextColor },
                    }}
                    position="bottom-center"
                />

                <>
                    {Component.auth ? (
                        <Auth>
                            <Component {...pageProps} />
                        </Auth>
                    ) : (
                        <Component {...pageProps} />
                    )}

                    <CreateProjectModal />
                    <CreateGoalModal />
                    <InviteUserModal />
                </>
            </GeistProvider>
        </>
    );
};

const App = ({ Component, pageProps: { session, ...pageProps } }: AppPropsWithAuth) => {
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <SessionProvider session={session}>
                <ApolloProvider client={apolloClient}>
                    <NextIntlProvider messages={pageProps.i18n}>
                        <ThemeProvider themes={['light', 'dark']} defaultTheme="dark">
                            <Root Component={Component} pageProps={pageProps} />
                        </ThemeProvider>
                    </NextIntlProvider>
                </ApolloProvider>
            </SessionProvider>
        </>
    );
};

export default App;
