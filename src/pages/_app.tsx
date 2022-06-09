import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ApolloProvider } from '@apollo/client';
import { SessionProvider, useSession, signIn } from 'next-auth/react';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { NextIntlProvider } from 'next-intl';
import { GeistProvider, Themes } from '@geist-ui/core';

import { Theme } from '../components/Theme';
import { apolloClient } from '../utils/apolloClient';
import { GlobalStyle } from '../components/GlobalStyle';
import { TextStyle } from '../components/Text';
import { NextPageWithAuth } from '../types/nextPageWithAuth';
import { backgroundColor, toastBackgroundColor, toastTextColor } from '../design/@generated/themes';
import { useHotkeys } from '../hooks/useHotkeys';
import { UserInviteModal } from '../components/UserInviteModal';
import { pageContext } from '../utils/pageContext';

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
                <GlobalStyle />
                <TextStyle />

                <Theme theme={themeType} />

                <Toaster
                    toastOptions={{
                        style: { borderRadius: '6px', background: toastBackgroundColor, color: toastTextColor },
                    }}
                    position="bottom-center"
                />

                <pageContext.Provider value={{ theme: themeType }}>
                    {Component.auth ? (
                        <Auth>
                            <Component {...pageProps} />
                        </Auth>
                    ) : (
                        <Component {...pageProps} />
                    )}

                    <UserInviteModal />
                </pageContext.Provider>
            </GeistProvider>
        </>
    );
};

const App = ({ Component, pageProps }: AppPropsWithAuth) => {
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <SessionProvider session={pageProps.session} refetchOnWindowFocus={true}>
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
