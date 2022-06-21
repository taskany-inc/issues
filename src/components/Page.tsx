import React from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';

import { gray4, textColor } from '../design/@generated/themes';
import { pageContext } from '../utils/pageContext';
import { ExternalPageProps } from '../utils/declareSsrProps';
import { useHotkeys } from '../hooks/useHotkeys';

import { Theme } from './Theme';
import { GlobalStyle } from './GlobalStyle';
import { TextStyle } from './Text';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProjectCreateModal } from './ProjectCreateModal';
import { GoalCreateModal } from './GoalCreateModal';
import { UserInviteModal } from './UserInviteModal';

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

    const { theme } = useTheme();

    return (
        <pageContext.Provider value={{ theme, locale }}>
            <Head>
                <title>{title}</title>
            </Head>

            <GlobalStyle />
            <TextStyle />
            <Theme theme={theme} />

            <Toaster
                toastOptions={{
                    style: { borderRadius: '6px', background: gray4, color: textColor },
                }}
                position="bottom-center"
            />

            <Header />

            <StyledContent>{children}</StyledContent>

            <ProjectCreateModal />
            <GoalCreateModal />
            <UserInviteModal />
            <Footer />
        </pageContext.Provider>
    );
};
