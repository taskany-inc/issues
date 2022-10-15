import { useCallback } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';

import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Project } from '../../../graphql/@generated/genql';
import { Page, PageContent } from '../../components/Page';
import { useMounted } from '../../hooks/useMounted';
import { Text } from '../../components/Text';
import { TabsMenu, TabsMenuItem } from '../../components/TabsMenu';
import { gapL, gapS, gray6 } from '../../design/@generated/themes';
import { PageSep } from '../../components/PageSep';
import { ProjectItem } from '../../components/ProjectItem';
import { nullable } from '../../utils/nullable';

const refreshInterval = 3000;

// @ts-ignore FIXME: https://github.com/taskany-inc/issues/issues/25
const fetcher = createFetcher(() => ({
    projects: {
        key: true,
        title: true,
        description: true,
        createdAt: true,
        computedActivity: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    },
}));

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        ssrData: await fetcher(user),
    }),
    {
        private: true,
    },
);

const StyledHeader = styled.div`
    padding-top: ${gapL};
`;

const StyledProjects = styled.div``;

const ProjectsPage = ({ user, locale, ssrData }: ExternalPageProps<{ projects: Project[] }>) => {
    const mounted = useMounted(refreshInterval);
    const t = useTranslations('projects.index');

    const { data, mutate } = useSWR(mounted ? [user] : null, (...args) => fetcher(...args), {
        refreshInterval,
    });

    const refresh = useCallback(() => mutate(), [mutate]);

    const projects: Project[] = data?.projects ?? ssrData.projects;

    return (
        <Page locale={locale} title={t('title')}>
            <PageContent>
                <StyledHeader>
                    <Text size="xxl" weight="bolder">
                        {t('explore')}
                    </Text>

                    <Text size="m" color={gray6} style={{ paddingTop: gapS }}>
                        {t('see what the Taskany community is most excited about today')}
                    </Text>

                    <TabsMenu>
                        <TabsMenuItem active>Projects</TabsMenuItem>
                        <TabsMenuItem>Goals</TabsMenuItem>
                        <TabsMenuItem>Issues</TabsMenuItem>
                        <TabsMenuItem>Boards</TabsMenuItem>
                    </TabsMenu>
                </StyledHeader>

                <PageSep />

                <StyledProjects>
                    {projects.map((project) =>
                        nullable(project, (p) => (
                            <ProjectItem
                                key={p.key}
                                projectKey={p.key}
                                title={p.title}
                                description={p.description}
                                createdAt={p.createdAt}
                                owner={p.computedActivity}
                            />
                        )),
                    )}
                </StyledProjects>
            </PageContent>
        </Page>
    );
};

export default ProjectsPage;
