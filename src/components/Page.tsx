import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';

import { gray4, radiusM, textColor } from '../design/@generated/themes';
import { pageContext } from '../utils/pageContext';
import { ExternalPageProps } from '../utils/declareSsrProps';
import { useHotkeys } from '../hooks/useHotkeys';

import { Theme } from './Theme';
import { GlobalStyle } from './GlobalStyle';
import { TextStyle } from './Text';
import { Header } from './Header';
import { Footer } from './Footer';

const ProjectCreateModal = dynamic(() => import('./ProjectCreateModal'));
const GoalCreateModal = dynamic(() => import('./GoalCreateModal'));
const UserInviteModal = dynamic(() => import('./UserInviteModal'));
const HotkeysModal = dynamic(() => import('./HotkeysModal'));

interface PageProps {
    locale: ExternalPageProps['locale'];
    title?: string;
}

const StyledContent = styled.div`
    /* presses the footer to the bottom*/
    min-height: calc(100vh - 160px);
`;

export const PageContent = styled.div`
    padding: 10px 40px 0 40px;
`;

export const Page: React.FC<PageProps> = ({ title = 'Untitled', locale, children }) => {
    useHotkeys();

    const { resolvedTheme } = useTheme();

    return (
        <pageContext.Provider value={{ theme: resolvedTheme, locale }}>
            <Head>
                <title>{title}</title>
            </Head>

            <GlobalStyle />
            <TextStyle />
            <Theme theme={resolvedTheme} />

            <Toaster
                toastOptions={{
                    style: { borderRadius: radiusM, background: gray4, color: textColor },
                }}
                position="bottom-center"
            />

            <Header />

            <StyledContent>{children}</StyledContent>

            <ProjectCreateModal />
            <GoalCreateModal />
            <UserInviteModal />
            <HotkeysModal />
            <Footer />
        </pageContext.Provider>
    );
};
