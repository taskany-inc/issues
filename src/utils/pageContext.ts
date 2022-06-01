import React from 'react';

interface PageContext {
    locale?: 'en' | 'ru';
    theme?: 'light' | 'dark';
}

export const pageContext = React.createContext<PageContext>({ locale: 'en', theme: 'dark' });
