import React from 'react';

import { TLocale } from '../types/locale';

export interface PageContext {
    locale?: TLocale;
    theme?: 'light' | 'dark';
}

export const pageContext = React.createContext<PageContext>({ locale: 'en', theme: 'dark' });
