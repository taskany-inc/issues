import React from 'react';

interface PageContext {
    locale: 'en' | 'ru';
}

export const pageContext = React.createContext<PageContext>({ locale: 'en' });
