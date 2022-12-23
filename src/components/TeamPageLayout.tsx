import React from 'react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { Team } from '../../graphql/@generated/genql';
import { routes } from '../hooks/router';
import { nullable } from '../utils/nullable';

import { Page, PageActions } from './Page';
import { CommonHeader } from './CommonHeader';
import { TabsMenu, TabsMenuItem } from './TabsMenu';

interface TeamPageLayoutProps extends React.ComponentProps<typeof Page> {
    team: Team;
    children: React.ReactNode;
    actions?: boolean;
}

export const TeamPageLayout: React.FC<TeamPageLayoutProps> = ({
    user,
    title,
    locale,
    ssrTime,
    team,
    children,
    actions,
}) => {
    const t = useTranslations('teams');
    const router = useRouter();

    const tabsMenuOptions: Array<[string, string, boolean]> = [
        [t('Projects'), routes.team(team.slug), false],
        [t('Goals'), routes.teamGoals(team.slug), false],
        [t('Settings'), routes.teamSettings(team.slug), true],
    ];

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={title}>
            <CommonHeader title={team.title} description={team.description}>
                <div>
                    {nullable(actions, () => (
                        <PageActions>
                            {/* <ProjectWatchButton
                        activityId={user.activityId}
                        projectId={project.id}
                        watchers={project.watchers}
                    />
                    <ProjectStarButton
                        activityId={user.activityId}
                        projectId={project.id}
                        stargizers={project.stargizers}
                    /> */}
                        </PageActions>
                    ))}
                </div>

                <TabsMenu>
                    {tabsMenuOptions.map(([title, href, ownerOnly]) =>
                        nullable(ownerOnly ? user.activityId === team.activityId : true, () => (
                            <NextLink key={href} href={href} passHref>
                                <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                            </NextLink>
                        )),
                    )}
                </TabsMenu>
            </CommonHeader>

            {children}
        </Page>
    );
};
