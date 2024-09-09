import { Session } from 'next-auth';
import React from 'react';

export interface PageContext {
    theme: 'light' | 'dark';
    themeId: number;
    ssrTime: number;
    user?: Session['user'];
    allowedServices?: {
        jira: boolean;
    };
}

export const pageContext = React.createContext<PageContext>({ theme: 'dark', themeId: 0, ssrTime: 0 });
