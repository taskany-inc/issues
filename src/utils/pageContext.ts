import { Session } from 'next-auth';
import React from 'react';

import { TLocale } from '../types/locale';

export interface PageContext {
    user?: Session['user'];
    locale?: TLocale;
    theme?: 'light' | 'dark';
    ssrTime?: number;
}

export const pageContext = React.createContext<PageContext>({ locale: 'en', theme: 'dark' });
