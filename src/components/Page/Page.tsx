import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { Session } from 'next-auth';
import { gray4, radiusM, textColor } from '@taskany/colors';
import { TextStyle, nullable } from '@taskany/bricks';

import { pageContext, PageContext } from '../../utils/pageContext';
import { useHotkeys } from '../../hooks/useHotkeys';
import { ModalEvent } from '../../utils/dispatchModal';
import { trpc } from '../../utils/trpcClient';
import { createProjectKeys, inviteUserKeys, createGoalKeys } from '../../utils/hotkeys';
import { Theme } from '../Theme';
import { PageFooter } from '../PageFooter/PageFooter';
import { ModalContext } from '../ModalOnEvent';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { PageNavigation } from '../PageNavigation/PageNavigation';
import { pageContent } from '../../utils/domObjects';

import s from './Page.module.css';

const OfflineBanner = dynamic(() => import('../OfflineBanner/OfflineBanner'), { ssr: false });
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalPreview = dynamic(() => import('../GoalPreview/GoalPreview'));
const ProjectCreateForm = dynamic(() => import('../ProjectCreateForm/ProjectCreateForm'));
const GoalCreateForm = dynamic(() => import('../GoalCreateForm/GoalCreateForm'));
const UserInviteForm = dynamic(() => import('../UserInviteForm/UserInviteForm'));
const HotkeysModal = dynamic(() => import('../HotkeysModal/HotkeysModal'));
const NotificationsHub = dynamic(() => import('../NotificationsHub/NotificationsHub'));
const FeedbackCreateForm = dynamic(() => import('../FeedbackCreateForm/FeedbackCreateForm'));
const WhatsNew = dynamic(() => import('../WhatsNew/WhatsNew'));
const ImageFullScreen = dynamic(() => import('../ImageFullScreen/ImageFullScreen'));

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    user: Session['user'];
    ssrTime: number;
    title?: string;
    header: React.ReactNode;
    children?: React.ReactNode;
}

const mapThemeOnId = { light: 0, dark: 1 } as const;

export const Page: React.FC<PageProps> = ({ user, ssrTime, title = 'Untitled', children, header, ...attrs }) => {
    const { setPreview } = useGoalPreview();
    const { data: userSettings = user?.settings } = trpc.user.settings.useQuery();
    const { data: config } = trpc.appConfig.get.useQuery();

    useHotkeys();

    const { resolvedTheme } = useTheme();
    const theme = (
        userSettings?.theme === 'system' ? resolvedTheme || 'dark' : userSettings?.theme || 'light'
    ) as PageContext['theme'];

    const router = useRouter();

    useEffect(() => {
        setPreview(null);
    }, [router.asPath, setPreview]);

    return (
        <pageContext.Provider value={{ user, theme, themeId: mapThemeOnId[theme], ssrTime }}>
            <Head>
                <link rel="icon" href={config?.favicon || '/favicon.png'} />
                <title>{title}</title>
                <link rel="stylesheet" id="themeVariables" href={`/theme/${theme}.css`} />
            </Head>

            <OfflineBanner />

            <TextStyle />

            {nullable(theme, (t) => (
                <Theme theme={t} />
            ))}

            <Toaster
                toastOptions={{
                    style: { borderRadius: radiusM, background: gray4, color: textColor },
                }}
                position="bottom-right"
            />

            <div className={s.PageLayout}>
                <aside className={s.PageAside}>
                    <PageNavigation logo={config?.logo ?? undefined} />
                </aside>

                <main className={s.PageMain} {...attrs}>
                    {header}
                    <div className={s.PageContent} {...pageContent.attr}>
                        {children}
                    </div>
                    <PageFooter />
                </main>
            </div>

            <ModalOnEvent event={ModalEvent.ProjectCreateModal} hotkeys={createProjectKeys}>
                <ProjectCreateForm />
            </ModalOnEvent>

            <ModalOnEvent event={ModalEvent.GoalCreateModal} hotkeys={createGoalKeys}>
                <ModalContext.Consumer>
                    {(ctx) => <GoalCreateForm {...ctx[ModalEvent.GoalCreateModal]} />}
                </ModalContext.Consumer>
            </ModalOnEvent>

            <ModalOnEvent event={ModalEvent.UserInviteModal} hotkeys={inviteUserKeys}>
                <UserInviteForm />
            </ModalOnEvent>

            <ModalOnEvent event={ModalEvent.FeedbackCreateModal}>
                <FeedbackCreateForm />
            </ModalOnEvent>

            <ModalOnEvent event={ModalEvent.ImageFullScreen}>
                <ModalContext.Consumer>
                    {(ctx) => <ImageFullScreen {...ctx[ModalEvent.ImageFullScreen]} />}
                </ModalContext.Consumer>
            </ModalOnEvent>

            <GoalPreview />

            <HotkeysModal />

            <NotificationsHub />

            <WhatsNew />
        </pageContext.Provider>
    );
};
