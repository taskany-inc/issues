import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { gapM, gapS, gray6, gray9 } from '@taskany/colors';
import { TabsMenu, TabsMenuItem, Text, nullable } from '@taskany/bricks';

import { routes } from '../hooks/router';
import { useProjectResource } from '../hooks/useProjectResource';
import { usePageContext } from '../hooks/usePageContext';
import { Project } from '../../graphql/@generated/genql';

import { PageContent, PageActions } from './Page';
import { WatchButton } from './WatchButton';
import { StarButton } from './StarButton';
import { ProjectTitleList } from './ProjectTitleList';

interface ProjectPageLayoutProps {
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
    padding-top: ${gapM};
`;

const StyledProjectParentTitle = styled(Text)`
    display: inline-block;
    padding-top: ${gapM};
`;

export const ProjectPageLayout: React.FC<ProjectPageLayoutProps> = ({ project, children, actions }) => {
    const { user } = usePageContext();
    const t = useTranslations('projects');
    const router = useRouter();
    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(project.id);

    const tabsMenuOptions: Array<[string, string, boolean]> = [
        [t('Goals'), routes.project(project.id), true],
        [t('Settings'), routes.projectSettings(project.id), true],
    ];

    const [watcher, setWatcher] = useState(project._isWatching);
    const onWatchToggle = useCallback(() => {
        setWatcher(!watcher);
    }, [watcher]);

    const [stargizer, setStargizer] = useState(project._isStarred);
    const onStarToggle = useCallback(() => {
        setStargizer(!stargizer);
    }, [stargizer]);

    return (
        <>
            <ProjectHeader>
                <div>
                    {Boolean(project.parent?.length) &&
                        nullable(project.parent, (parent) => (
                            <StyledProjectParentTitle weight="bold" color={gray9}>
                                <ProjectTitleList projects={parent} />
                            </StyledProjectParentTitle>
                        ))}

                    <StyledProjectHeaderTitle size="xxl" weight="bolder">
                        {project.title}
                    </StyledProjectHeaderTitle>

                    {nullable(project.description, (d) => (
                        <Text size="m" color={gray6} style={{ paddingTop: gapS }}>
                            {d}
                        </Text>
                    ))}
                </div>

                <PageActions>
                    {nullable(actions, () => (
                        <>
                            <WatchButton watcher={watcher} onToggle={toggleProjectWatching(onWatchToggle, watcher)} />
                            <StarButton
                                stargizer={stargizer}
                                count={project._count?.stargizers}
                                onToggle={toggleProjectStar(onStarToggle, stargizer)}
                            />
                        </>
                    ))}
                </PageActions>

                <TabsMenu>
                    {tabsMenuOptions.map(([title, href, ownerOnly]) =>
                        nullable(ownerOnly ? user?.activityId === project.activityId : true, () => (
                            <NextLink key={title} href={href} passHref>
                                <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                            </NextLink>
                        )),
                    )}
                </TabsMenu>
            </ProjectHeader>

            {children}
        </>
    );
};
