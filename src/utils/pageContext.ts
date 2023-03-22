import { Session } from 'next-auth';
import React from 'react';

import { TLocale } from '../i18n/getLang';

export interface PageContext {
    locale: TLocale;
    theme: 'light' | 'dark';
    themeId: number;
    ssrTime: number;
    user?: Session['user'];
}

export const pageContext = React.createContext<PageContext>({ locale: 'en', theme: 'dark', themeId: 0, ssrTime: 0 });
