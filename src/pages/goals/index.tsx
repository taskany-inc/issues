import React, { MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';

import { Flow, Goal, Project, Team } from '../../../graphql/@generated/genql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page, PageContent } from '../../components/Page';
import { GoalListItem } from '../../components/GoalListItem';
import { nullable } from '../../utils/nullable';
import { CommonHeader } from '../../components/CommonHeader';
import { FiltersPanel } from '../../components/FiltersPanel';
import { useMounted } from '../../hooks/useMounted';
import { useUrlParams } from '../../hooks/useUrlParams';
import { Text } from '../../components/Text';
import { Link } from '../../components/Link';
import { PageSep } from '../../components/PageSep';
import { defaultLimit } from '../../components/LimitFilterDropdown';
import { routes } from '../../hooks/router';

const GoalPreview = dynamic(() => import('../../components/GoalPreview'));

const refreshInterval = 3000;
const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

const fetcher = createFetcher((_, priority = [], states = [], query = '', tags = [], owner = []) => ({
    goalPriorityColors: true,
    goalPriorityKind: true,
    flowRecommended: {
        id: true,
        title: true,
        states: {
            id: true,
            title: true,
        },
    },
    userGoals: [
        {
            data: {
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
            project: {
                id: true,
                key: true,
                title: true,
                flowId: true,
                teams: {
                    id: true,
                    slug: true,
                    key: true,
                    title: true,
                },
            },
            team: {
                id: true,
                slug: true,
                key: true,
                title: true,
            },
            priority: true,
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
    padding: 0;
    margin: 0 -20px;
`;

const StyledProjectGroup = styled.div`
    padding: 0 20px 40px 20px;
    margin: 0 -20px;
`;

export const getServerSideProps = declareSsrProps(
    async ({ user, query }) => {
        return {
            ssrData: await fetcher(
                user,
                parseQueryParam(query.priority as string),
                parseQueryParam(query.state as string),
                parseQueryParam(query.search as string).toString(),
                parseQueryParam(query.tags as string),
                parseQueryParam(query.user as string),
                Number(parseQueryParam(query.limit as string)),
            ),
        };
    },
    {
        private: true,
    },
);

const GoalsPage = ({
    user,
    ssrTime,
    locale,
    ssrData,
}: ExternalPageProps<{ userGoals: Goal[]; flowRecommended: Flow[] }>) => {
    const t = useTranslations('goals.index');
    const mounted = useMounted(refreshInterval);
    const router = useRouter();

    const [priorityFilter, setPriorityFilter] = useState<string[]>(parseQueryParam(router.query.priority as string));
    const [stateFilter, setStateFilter] = useState<string[]>(parseQueryParam(router.query.state as string));
    const [tagsFilter, setTagsFilter] = useState<string[]>(parseQueryParam(router.query.tags as string));
    const [ownerFilter, setOwnerFilter] = useState<string[]>(parseQueryParam(router.query.user as string));
    const [fulltextFilter, setFulltextFilter] = useState(parseQueryParam(router.query.search as string).toString());
    const [limitFilter, setLimitFilter] = useState(Number(router.query.limit) || defaultLimit);

    const [preview, setPreview] = useState<Goal | null>(null);

    const { data } = useSWR(
        mounted ? [user, priorityFilter, stateFilter, fulltextFilter, tagsFilter, ownerFilter, limitFilter] : null,
        (...args) => fetcher(...args),
        {
            refreshInterval,
        },
    );

    const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFulltextFilter(e.currentTarget.value);
    }, []);

    // NB: this line is compensation for first render before delayed swr will bring updates
    const goals: Goal[] = data?.userGoals ?? ssrData.userGoals;
    const goalsCount = goals.length;
    const flowRecommended = data?.flowRecommended ?? ssrData.flowRecommended;

    useEffect(() => {
        if (preview && goals.filter((g) => g.id === preview.id).length !== 1) {
            setPreview(null);
        }
    }, [goals, preview]);

    const [usersFilterData, tagsFilterData] = useMemo(() => {
        const projectsData = new Map();
        const tagsData = new Map();
        const usersData = new Map();

        goals.forEach((g) => {
            g?.owner?.id && usersData.set(g?.owner?.id, g?.owner);
            g.project?.id &&
                projectsData.set(g.project?.id, {
                    id: g.project?.id,
                    title: g.project?.title,
                    flowId: g.project?.flowId,
                });
            g?.tags?.forEach((t) => tagsData.set(t?.id, t));
        });

        return [
            Array.from(usersData.values()),
            Array.from(tagsData.values()),
            Array.from(projectsData.values()), // https://github.com/taskany-inc/issues/issues/438
        ];
    }, [goals]);

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

    const groups = useMemo(() => {
        return goals.reduce(
            (acc, goal) => {
                if (goal.team?.id) {
                    const team = acc.teams[goal.team.id] || {
                        data: goal.team,
                        goals: [],
                    };

                    team.goals.push(goal);
                    acc.teams[goal.team.id] = team;
                }

                if (goal.project) {
                    const project = acc.projects[goal.project.id] || {
                        data: goal.project,
                        goals: [],
                    };

                    // sort teams by title
                    project.teams = goal.project.teams?.length
                        ? goal.project.teams
                              // @ts-ignore
                              ?.sort((a, b) => (a?.title > b?.title ? 1 : -1))
                        : undefined;

                    project.goals.push(goal);
                    acc.projects[goal.project.id] = project;
                }

                return acc;
            },
            { teams: {}, projects: {} } as {
                teams: Record<number, { data: Team; goals: Goal[] }>;
                projects: Record<number, { data: Project; teams?: Array<Team | undefined>; goals: Goal[] }>;
            },
        );
    }, [goals]);

    return (
        <Page user={user} ssrTime={ssrTime} locale={locale} title={t('title')}>
            <CommonHeader title={t('Dashboard')} description={t('This is your personal goals bundle')}></CommonHeader>

            <FiltersPanel
                count={goalsCount}
                flowId={flowRecommended?.[0].id}
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
                {Object.values(groups.teams).map((team) => {
                    return nullable(team.goals?.length, () => (
                        <StyledProjectGroup key={team.data.key}>
                            <Text size="l" weight="bolder">
                                <NextLink passHref href={routes.team(team.data.slug)}>
                                    <Link inline>{team.data.title}</Link>
                                </NextLink>
                            </Text>

                            <PageSep />

                            <StyledGoalsList>
                                {team.goals?.map((goal) =>
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

                {Object.values(groups.projects)
                    .sort((a, b) => (a.teams && !b.teams ? -1 : 1))
                    .map((project) =>
                        nullable(project.goals?.length, () => (
                            <StyledProjectGroup key={project.data.key}>
                                <Text size="l" weight="bolder">
                                    {nullable(project.teams, (teams) => (
                                        <>
                                            {teams.map((team, i) =>
                                                nullable(team, (t) => (
                                                    <>
                                                        <NextLink key={t.slug} passHref href={routes.team(t.slug)}>
                                                            <Link inline>{t.title}</Link>
                                                        </NextLink>
                                                        {i !== teams.length - 1 ? ', ' : ''}
                                                    </>
                                                )),
                                            )}
                                            {' — '}
                                        </>
                                    ))}
                                    <NextLink passHref href={routes.project(project.data.key)}>
                                        <Link inline>{project.data.title}</Link>
                                    </NextLink>
                                </Text>

                                <PageSep />

                                <StyledGoalsList>
                                    {project.goals?.map((goal) =>
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
                        )),
                    )}
            </PageContent>

            {nullable(preview, (p) => (
                <GoalPreview
                    goal={p}
                    visible={Boolean(p)}
                    onClose={onGoalPreviewClose}
                    onDelete={onGoalPreviewDelete}
                />
            ))}
        </Page>
    );
};

export default GoalsPage;
