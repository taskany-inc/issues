import React from 'react';
import Head from 'next/head';

import { pageContext } from '../utils/pageContext';
import { ExternalPageProps } from '../utils/ssrProps';

import { Header } from './Header';

interface PageProps {
    locale: ExternalPageProps['locale'];
    title: string;
}

export const Page: React.FC<PageProps> = ({ title, locale, children }) => {
    return (
        <pageContext.Provider value={{ locale }}>
            <Head>
                <title>{title}</title>
            </Head>

            <Header />

            {children}
        </pageContext.Provider>
    );
};
