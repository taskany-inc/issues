import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { routes } from '../hooks/router';
import { Project } from '../../graphql/@generated/genql';
import { gapM, gapS, gray6, gray9 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { PageContent, Page, PageActions } from './Page';
import { ProjectStarButton } from './ProjectStarButton';
import { ProjectWatchButton } from './ProjectWatchButton';
import { Text } from './Text';
import { TabsMenu, TabsMenuItem } from './TabsMenu';
import { Link } from './Link';

interface ProjectPageLayoutProps extends React.ComponentProps<typeof Page> {
    project: Project;
    children: React.ReactNode;
    actions?: boolean;
}

const ProjectHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const StyledProjectHeaderTitle = styled(Text)`
    width: 850px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-top: ${gapM};
`;

const StyledProjectTeamsTitle = styled(Text)`
    display: inline-block;
    padding-top: ${gapM};
`;

export const ProjectPageLayout: React.FC<ProjectPageLayoutProps> = ({
    user,
    title,
    locale,
    ssrTime,
    project,
    children,
    actions,
}) => {
    const t = useTranslations('projects');
    const router = useRouter();

    const tabsMenuOptions: Array<[string, string, boolean]> = [
        [t('Goals'), routes.project(project.key), false],
        [t('Settings'), routes.projectSettings(project.key), true],
    ];

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={title}>
            <ProjectHeader>
                <div>
                    {nullable(project.teams, (teams) => (
                        <StyledProjectTeamsTitle weight="bold" color={gray9}>
                            {t('Teams')}:{' '}
                            {teams.map((team) =>
                                nullable(team, (te) => (
                                    <NextLink key={te.slug} passHref href={routes.team(te.slug)}>
                                        <Link inline title={te.description}>
                                            {te.title}
                                        </Link>
                                    </NextLink>
                                )),
                            )}
                        </StyledProjectTeamsTitle>
                    ))}

                    <StyledProjectHeaderTitle size="xxl" weight="bolder" title={project.title}>
                        {project.title}
                    </StyledProjectHeaderTitle>

                    {nullable(project.description, (d) => (
                        <Text size="m" color={gray6} style={{ paddingTop: gapS }}>
                            {d}
                        </Text>
                    ))}
                </div>

                {nullable(actions, () => (
                    <PageActions>
                        <ProjectWatchButton
                            activityId={user.activityId}
                            projectId={project.id}
                            watchers={project.watchers}
                        />
                        <ProjectStarButton
                            activityId={user.activityId}
                            projectId={project.id}
                            stargizers={project.stargizers}
                        />
                    </PageActions>
                ))}

                <TabsMenu>
                    {tabsMenuOptions.map(([title, href, ownerOnly]) =>
                        nullable(ownerOnly ? user.activityId === project.activityId : true, () => (
                            <NextLink key={href} href={href} passHref>
                                <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                            </NextLink>
                        )),
                    )}
                </TabsMenu>
            </ProjectHeader>

            {children}
        </Page>
    );
};
