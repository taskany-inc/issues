import React, { useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';

import { gray4, radiusM, textColor } from '../design/@generated/themes';
import { pageContext } from '../utils/pageContext';
import { ExternalPageProps } from '../utils/declareSsrProps';
import { useHotkeys } from '../hooks/useHotkeys';
import { ModalEvent } from '../utils/dispatchModal';
import { createProjectKeys, inviteUserKeys, createGoalKeys } from '../utils/hotkeys';
import { useRouter } from '../hooks/router';

import { Theme } from './Theme';
import { GlobalStyle } from './GlobalStyle';
import { TextStyle } from './Text';
import { Header } from './Header';
import { Footer } from './Footer';
import ModalOnEvent from './ModalOnEvent';

const ProjectCreateForm = dynamic(() => import('./ProjectCreateForm'));
const GoalCreateForm = dynamic(() => import('./GoalCreateForm'));
const UserInviteForm = dynamic(() => import('./UserInviteForm'));
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
    const router = useRouter();

    const { resolvedTheme } = useTheme();

    const onProjectCreate = useCallback(
        (key?: string) => {
            key && router.project(key);
        },
        [router],
    );

    const onGoalCreate = useCallback(
        (key?: string) => {
            key && router.goal(key);
        },
        [router],
    );

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

            <ModalOnEvent event={ModalEvent.ProjectCreateModal} hotkeys={createProjectKeys}>
                <ProjectCreateForm locale={locale} onCreate={onProjectCreate} />
            </ModalOnEvent>

            <ModalOnEvent event={ModalEvent.GoalCreateModal} hotkeys={createGoalKeys}>
                <GoalCreateForm locale={locale} onCreate={onGoalCreate} />
            </ModalOnEvent>

            <ModalOnEvent event={ModalEvent.UserInviteModal} hotkeys={inviteUserKeys}>
                <UserInviteForm locale={locale} />
            </ModalOnEvent>

            <HotkeysModal />

            <Footer />
        </pageContext.Provider>
    );
};
