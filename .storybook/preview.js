import React from 'react';
import { GeistProvider, CssBaseline, Themes } from '@geist-ui/core';
import { ThemeProvider, useTheme } from 'next-themes';
import { backgroundColor, toastBackgroundColor, toastTextColor } from '../src/design/@generated/themes'; //design/@generated/themes
import { GlobalStyle } from '../src/components/GlobalStyle';
import { Theme } from '../src/components/Theme';


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

        const themeType = context.globals.theme;
        return (
            <ThemeProvider themes={['light', 'dark']} defaultTheme="dark">
                <GeistProvider themes={[customGeistDarkTheme, customGeistLightTheme]} themeType={geistThemesMap[themeType]}>
                    <CssBaseline />

                    <GlobalStyle />

                    <Theme theme={themeType} />
                    <Story />
                </GeistProvider>
            </ThemeProvider>
        );
    },
];

export const globalTypes = {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        // Array of plain string values or MenuItem shape (see below)
        items: ['light', 'dark'],
        // Property that specifies if the name of the item will be displayed
        showName: true,
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  };
