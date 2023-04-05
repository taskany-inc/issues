import React from 'react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { Team } from '../../graphql/@generated/genql';
import { routes } from '../hooks/router';
import { nullable } from '../utils/nullable';
import { usePageContext } from '../hooks/usePageContext';

import { PageActions } from './Page';
import { CommonHeader } from './CommonHeader';
import { TabsMenu, TabsMenuItem } from './TabsMenu';

interface TeamPageLayoutProps {
    team: Team;
    children: React.ReactNode;
    actions?: boolean;
}

export const TeamPageLayout: React.FC<TeamPageLayoutProps> = ({ team, children, actions }) => {
    const { user } = usePageContext();
    const t = useTranslations('teams');
    const router = useRouter();

    const tabsMenuOptions: Array<[string, string, boolean]> = [
        [t('Projects'), routes.team(team.id), false],
        [t('Goals'), routes.teamGoals(team.id), false],
        [t('Settings'), routes.teamSettings(team.id), true],
    ];

    return (
        <>
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
                        nullable(ownerOnly ? user?.activityId === team.activityId : true, () => (
                            <NextLink key={href} href={href} passHref>
                                <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                            </NextLink>
                        )),
                    )}
                </TabsMenu>
            </CommonHeader>

            {children}
        </>
    );
};
