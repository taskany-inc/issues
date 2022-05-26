import React from 'react';
import Head from 'next/head';

import { pageContext } from '../utils/pageContext';
import { ExternalPageProps } from '../utils/ssrProps';

import { Header } from './Header';
import { Footer } from './Footer';
import styled from 'styled-components';

interface PageProps {
    locale: ExternalPageProps['locale'];
    title: string;
}

const StyledContent = styled.div`
    min-height: calc(100vh - 120px);
`;

export const Page: React.FC<PageProps> = ({ title, locale, children }) => {
    return (
        <pageContext.Provider value={{ locale }}>
            <Head>
                <title>{title}</title>
            </Head>
            <Header />
            <StyledContent>{children}</StyledContent>
            <Footer />
        </pageContext.Provider>
    );
};
