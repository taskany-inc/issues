/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useRouter as useNextRouter } from 'next/router';

import { createFetcher } from '../../../utils/createFetcher';
import { Goal } from '../../../../graphql/@generated/genql';
import { GoalListItem } from '../../../components/GoalListItem';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { FiltersPanel } from '../../../components/FiltersPanel';
import { defaultLimit } from '../../../components/LimitFilterDropdown';
import { useUrlParams } from '../../../hooks/useUrlParams';
import { TeamPageLayout } from '../../../components/TeamPageLayout';
import { Page, PageContent } from '../../../components/Page';
import { Text } from '../../../components/Text';
import { PageSep } from '../../../components/PageSep';

const GoalPreview = dynamic(() => import('../../../components/GoalPreview'));

const refreshInterval = 3000;
const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

const fetcher = createFetcher((_, slug, priority = [], states = [], query = '', tags = [], owner = []) => ({
    team: [
        {
            slug,
        },
        {
            id: true,
            slug: true,
            title: true,
            description: true,
            activityId: true,
            projects: {
                key: true,
                title: true,
                description: true,
                createdAt: true,
                activity: {
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
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
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
    teamProjects: [
        {
            data: {
                slug,
                priority,
                states,
                tags,
                owner,
                query,
            },
        },
        {
            key: true,
            title: true,
            flowId: true,
            goals: {
                id: true,
                title: true,
                description: true,
                priority: true,
                project: {
                    id: true,
                    key: true,
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
        },
    ],
    teamGoals: [
        {
            data: {
                slug,
                priority,
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
            priority: true,
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
}));

const StyledGoalsList = styled.div`
    padding: 0 0 20px 0;
    margin: 0 -20px;
`;

const StyledProjectGroup = styled.div`
    padding: 0 20px 40px 20px;
    margin: 0 -20px;
`;

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { slug } }) => {
        const ssrData = await fetcher(user, slug);

        return ssrData.team
            ? { ssrData }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

const TeamGoalsPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { slug },
}: ExternalPageProps<Awaited<ReturnType<typeof fetcher>>, { slug: string }>) => {
    const t = useTranslations('teams');
    const nextRouter = useNextRouter();

    const [priorityFilter, setPriorityFilter] = useState<string[]>(
        parseQueryParam(nextRouter.query.priority as string),
    );
    const [stateFilter, setStateFilter] = useState<string[]>(parseQueryParam(nextRouter.query.state as string));
    const [tagsFilter, setTagsFilter] = useState<string[]>(parseQueryParam(nextRouter.query.tags as string));
    const [ownerFilter, setOwnerFilter] = useState<string[]>(parseQueryParam(nextRouter.query.user as string));
    const [fulltextFilter, setFulltextFilter] = useState(parseQueryParam(nextRouter.query.search as string).toString());
    const [limitFilter, setLimitFilter] = useState(Number(nextRouter.query.limit) || defaultLimit);

    const [preview, setPreview] = useState<Goal | null>(null);

    const { data } = useSWR(
        [user, slug, priorityFilter, stateFilter, fulltextFilter, tagsFilter, ownerFilter, limitFilter],
        (...args) => fetcher(...args),
        {
            refreshInterval,
            fallbackData: ssrData,
        },
    );

    if (!data) return null;

    const team = data?.team;

    if (!team) return nextRouter.push('/404');

    const projects = data?.teamProjects;
    const goals = data?.teamGoals;

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

    // FIXME: plain list of goals
    // useEffect(() => {
    // if (preview && goals && goals?.filter((g) => g.id === preview.id).length !== 1) {
    //     console.log(goals, preview.id);
    //     setPreview(null);
    // }
    // }, [goals, preview]);

    const [usersFilterData, tagsFilterData, goalsCount] = useMemo(() => {
        const projectsData = new Map();
        const tagsData = new Map();
        const usersData = new Map();
        let goalsCount = 0;

        projects?.forEach((p) => {
            projectsData.set(p.id, {
                id: p.id,
                tittle: p.title,
            });

            p.goals?.forEach((g: Goal) => {
                goalsCount++;
                usersData.set(g?.owner?.id, g?.owner);
                g?.tags?.forEach((t) => tagsData.set(t?.id, t));
            });
        });

        goals?.forEach((g) => {
            goalsCount++;
            usersData.set(g?.owner?.id, g?.owner);
            g?.tags?.forEach((t) => tagsData.set(t?.id, t));
        });

        return [
            Array.from(usersData.values()),
            Array.from(tagsData.values()),
            goalsCount,
            Array.from(projectsData.values()), // https://github.com/taskany-inc/issues/issues/438
        ];
    }, [projects, goals]);

    useUrlParams(priorityFilter, stateFilter, tagsFilter, ownerFilter, fulltextFilter, limitFilter);

    const onGoalPrewiewShow = useCallback(
        (goal: Goal): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey) return;

                e.preventDefault();
                setPreview(goal);
            },
        [],
    );

    const onGoalPreviewClose = useCallback(() => {
        setPreview(null);
    }, []);

    const onGoalPreviewDelete = useCallback(() => {
        setPreview(null);
    }, []);

    return (
        <Page
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('goals.title', {
                team: () => team?.title,
            })}
        >
            <TeamPageLayout actions team={team}>
                <FiltersPanel
                    count={goalsCount}
                    flowId={projects?.[0]?.flowId}
                    users={usersFilterData}
                    tags={tagsFilterData}
                    priorityFilter={priorityFilter}
                    stateFilter={stateFilter}
                    tagsFilter={tagsFilter}
                    ownerFilter={ownerFilter}
                    searchFilter={fulltextFilter}
                    limitFilter={limitFilter}
                    onSearchChange={onSearchChange}
                    onPriorityChange={setPriorityFilter}
                    onStateChange={setStateFilter}
                    onUserChange={setOwnerFilter}
                    onTagChange={setTagsFilter}
                    onLimitChange={setLimitFilter}
                />

                <PageContent>
                    <StyledGoalsList>
                        {goals?.map((goal) =>
                            nullable(goal, (g) => (
                                <GoalListItem
                                    createdAt={g.createdAt}
                                    id={g.id}
                                    state={g.state}
                                    title={g.title}
                                    issuer={g.activity}
                                    owner={g.owner}
                                    tags={g.tags}
                                    priority={g.priority}
                                    comments={g.comments?.length}
                                    key={g.id}
                                    focused={g.id === preview?.id}
                                    onClick={onGoalPrewiewShow(g)}
                                />
                            )),
                        )}
                    </StyledGoalsList>
                </PageContent>

                <PageContent>
                    {projects?.map((project) => {
                        return nullable(project.goals?.length, () => (
                            <StyledProjectGroup key={project.key}>
                                <Text size="l" weight="bolder">
                                    {project.title}
                                </Text>

                                <PageSep />

                                <StyledGoalsList>
                                    {project.goals?.map((goal: Goal) =>
                                        nullable(goal, (g) => (
                                            <GoalListItem
                                                createdAt={g.createdAt}
                                                id={g.id}
                                                state={g.state}
                                                title={g.title}
                                                issuer={g.activity}
                                                owner={g.owner}
                                                tags={g.tags}
                                                priority={g.priority}
                                                comments={g.comments?.length}
                                                key={g.id}
                                                focused={g.id === preview?.id}
                                                onClick={onGoalPrewiewShow(g)}
                                            />
                                        )),
                                    )}
                                </StyledGoalsList>
                            </StyledProjectGroup>
                        ));
                    })}
                </PageContent>

                {nullable(preview, (p) => (
                    <GoalPreview
                        goal={p}
                        visible={Boolean(p)}
                        onClose={onGoalPreviewClose}
                        onDelete={onGoalPreviewDelete}
                    />
                ))}
            </TeamPageLayout>
        </Page>
    );
};

export default TeamGoalsPage;
