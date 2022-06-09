import React from 'react';
import { GeistProvider, Themes } from '@geist-ui/core';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';

import { pageContext } from '../src/utils/pageContext';
import { backgroundColor } from '../src/design/@generated/themes';
import { GlobalStyle } from '../src/components/GlobalStyle';
import { Theme } from '../src/components/Theme';
import { TextStyle } from '../src/components/Text';


import { NextIntlProvider } from 'next-intl';
import en from '../i18n/en.json';

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
};

export const decorators = [
    (Story, context) => {
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

        const session = {
            user: {
                id: 'example_id',
                name: 'Name',
                email: 'example@mail.test',
                image: null,
                role: 'ADMIN',
            },
        };

        const themeType = context.globals.theme;

        return (
            <SessionProvider session={session} refetchOnWindowFocus={true}>
                <NextIntlProvider messages={en} locale="en">

                    <ThemeProvider themes={['light', 'dark']} defaultTheme="dark">
                        <GeistProvider
                            themes={[customGeistDarkTheme, customGeistLightTheme]}
                            themeType={geistThemesMap[themeType]}
                        >
                            <GlobalStyle />
                            <TextStyle />

                            <Theme theme={themeType} />

                            <pageContext.Provider value={{ theme: themeType }}>
                                <Story />
                            </pageContext.Provider>
                        </GeistProvider>
                    </ThemeProvider>
                </NextIntlProvider>
            </SessionProvider>
        );
    },
];

export const globalTypes = {
    theme: {
        name: 'Theme',
        description: 'Global theme for components',
        defaultValue: 'dark',
        toolbar: {
            icon: 'circlehollow',
            items: [
                { value: 'light', icon: 'circlehollow', title: 'Light' },
                { value: 'dark', icon: 'circle', title: 'Dark' },
            ],
            showName: true,
        },
    },
};
