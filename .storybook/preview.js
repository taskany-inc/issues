import React from 'react';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';

import { pageContext } from '../src/utils/pageContext';
import { GlobalStyle } from '../src/components/GlobalStyle';
import { Theme } from '../src/components/Theme';
import { TextStyle } from '../src/components/lib/Text';

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
                        <GlobalStyle />
                        <TextStyle />
                        <Theme theme={themeType} />

                        <pageContext.Provider value={{ theme: themeType, locale: 'en' }}>
                            <Story />
                        </pageContext.Provider>
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
