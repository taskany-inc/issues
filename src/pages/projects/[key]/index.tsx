import { useCallback, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

import { routes } from '../../../hooks/router';
import { createFetcher } from '../../../utils/createFetcher';
import { Goal, Project } from '../../../../graphql/@generated/genql';
import { Page } from '../../../components/Page';
import { Button } from '../../../components/Button';
import { GoalItem } from '../../../components/GoalItem';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { gapS } from '../../../design/@generated/themes';
import { CommonHeader } from '../../../components/CommonHeader';
import { TabsMenu, TabsMenuItem } from '../../../components/TabsMenu';
import { ProjectWatchButton } from '../../../components/ProjectWatchButton';
import { ProjectStarButton } from '../../../components/ProjectStarButton';
import { FiltersPanel, defaultLimit } from '../../../components/FiltersPanel';

// @ts-ignore
const fetcher = createFetcher(
    (_, key: string, offset = 0, states = [], query = '', limitFilter = defaultLimit, tags = [], owner = []) => ({
        project: [
            {
                key,
            },
            {
                id: true,
                key: true,
                title: true,
                description: true,
                activityId: true,
                flow: {
                    id: true,
                },
                watchers: {
                    id: true,
                },
                stargizers: {
                    id: true,
                },
                tags: {
                    id: true,
                    title: true,
                },
                participants: {
                    id: true,
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                createdAt: true,
                activity: {
                    id: true,
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                    ghost: {
                        id: true,
                        email: true,
                    },
                },
            },
        ],
        projectGoals: [
            {
                data: {
                    key,
                    offset,
                    pageSize: limitFilter,
                    states,
                    tags,
                    owner,
                    query,
                },
            },
            {
                id: true,
                title: true,
                description: true,
                project: {
                    id: true,
                    title: true,
                },
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
                activity: {
                    id: true,
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                    ghost: {
                        id: true,
                        email: true,
                    },
                },
                owner: {
                    id: true,
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                    ghost: {
                        id: true,
                        email: true,
                    },
                },
                tags: {
                    id: true,
                    title: true,
                    description: true,
                },
                comments: {
                    id: true,
                },
                createdAt: true,
                updatedAt: true,
            },
        ],
        projectGoalsCount: [
            {
                data: {
                    key,
                    states,
                    tags,
                    owner,
                    query,
                },
            },
        ],
    }),
);

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key } }) => ({
        ssrData: await fetcher(user, key),
    }),
    {
        private: true,
    },
);

const StyledGoalsList = styled.div`
    padding: 20px 20px 0 20px;
`;

const StyledLoadMore = styled.div`
    margin: 50px 40px;
`;

const StyledProjectActions = styled.div`
    justify-self: right;
    justify-items: end;

    align-content: space-between;

    > * + * {
        margin-left: ${gapS};
    }
`;

const ProjectPage = ({
    user,
    locale,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[]; projectGoalsCount: number }, { key: string }>) => {
    const t = useTranslations('projects.key');
    const [fulltextFilter, setFulltextFilter] = useState('');
    const [stateFilter, setStateFilter] = useState<string[]>();
    const [tagsFilter, setTagsFilter] = useState<string[]>();
    const [ownerFilter, setOwnerFilter] = useState<string[]>();
    const [limitFilter, setLimitFilter] = useState(defaultLimit);

    const { data, setSize, size } = useSWRInfinite(
        (index: number) => ({
            offset: index * limitFilter,
            stateFilter,
            fulltextFilter,
            limitFilter,
            tagsFilter,
            ownerFilter,
        }),
        ({ offset, stateFilter, fulltextFilter, limitFilter, tagsFilter, ownerFilter }) =>
            fetcher(user, key, offset, stateFilter, fulltextFilter, limitFilter, tagsFilter, ownerFilter),
    );

    const shouldRenderMoreButton = data?.[data.length - 1]?.projectGoals?.length === limitFilter;

    const goals = fulltextFilter
        ? data?.map((chunk) => chunk.projectGoals).flat()
        : data?.map((chunk) => chunk.projectGoals).flat() ?? ssrData.projectGoals;
    const project = data?.[0].project ?? ssrData.project;
    const goalsCount = data?.[0].projectGoalsCount ?? ssrData.projectGoalsCount;

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

    return (
        <Page
            locale={locale}
            title={t.rich('title', {
                project: () => project.title,
            })}
        >
            <CommonHeader
                preTitle={`${t('key')}: ${project.key}`}
                title={project.title}
                description={project.description}
            >
                <StyledProjectActions>
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
                </StyledProjectActions>

                <TabsMenu>
                    <TabsMenuItem active>Goals</TabsMenuItem>
                    <TabsMenuItem>Issues</TabsMenuItem>
                    <TabsMenuItem>Boards</TabsMenuItem>
                    <TabsMenuItem>Wiki</TabsMenuItem>

                    {nullable(user.activityId === project.activityId, () => (
                        <NextLink href={routes.projectSettings(key)} passHref>
                            <TabsMenuItem>Settings</TabsMenuItem>
                        </NextLink>
                    ))}
                </TabsMenu>
            </CommonHeader>

            <FiltersPanel
                count={goalsCount}
                flowId={project.flow?.id}
                users={project.participants}
                tags={project.tags}
                onSearchChange={onSearchChange}
                onStateChange={setStateFilter}
                onUserChange={setOwnerFilter}
                onTagChange={setTagsFilter}
                onLimitChange={setLimitFilter}
            />

            <StyledGoalsList>
                {goals?.map((goal) =>
                    nullable(goal, (g) => (
                        <GoalItem
                            createdAt={g.createdAt}
                            id={g.id}
                            state={g.state}
                            title={g.title}
                            issuer={g.activity}
                            owner={g.owner}
                            tags={g.tags}
                            comments={g.comments?.length}
                            key={g.id}
                        />
                    )),
                )}

                <StyledLoadMore>
                    {shouldRenderMoreButton && <Button text={t('Load more')} onClick={() => setSize(size + 1)} />}
                </StyledLoadMore>
            </StyledGoalsList>
        </Page>
    );
};

export default ProjectPage;
