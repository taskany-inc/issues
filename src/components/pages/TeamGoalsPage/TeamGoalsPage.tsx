/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { useRouter as useNextRouter } from 'next/router';

import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { Goal } from '../../../../graphql/@generated/genql';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { FiltersPanel } from '../../FiltersPanel';
import { parseFilterValues, useUrlFilterParams } from '../../../hooks/useUrlFilterParams';
import { TeamPageLayout } from '../../TeamPageLayout';
import { Page, PageContent } from '../../Page';
import { GoalsGroup, GoalsGroupProjectTitle, GoalsGroupTeamTitle } from '../../GoalGroup';
import { useGrouppedGoals } from '../../../hooks/useGrouppedGoals';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useWillUnmount } from '../../../hooks/useWillUnmount';

import { tr } from './TeamGoalsPage.i18n';

const GoalPreview = dynamic(() => import('../../GoalPreview'));

const fetcher = createFetcher(
    (_, id, priority = [], states = [], tags = [], estimates = [], owner = [], projects = [], query = '') => ({
        team: [
            {
                id,
            },
            {
                id: true,
                title: true,
                description: true,
                activityId: true,
                projects: {
                    id: true,
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
        teamGoals: [
            {
                data: {
                    id,
                    priority,
                    states,
                    tags,
                    estimates,
                    owner,
                    projects,
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
                    flowId: true,
                    teams: {
                        id: true,
                        title: true,
                    },
                },
                team: {
                    id: true,
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
        teamGoalsMeta: [
            {
                data: {
                    id,
                    priority: [],
                    states: [],
                    tags: [],
                    estimates: [],
                    owner: [],
                    projects: [],
                    query: '',
                },
            },
            {
                owners: {
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
                tags: { id: true, title: true, description: true },
                states: {
                    id: true,
                    title: true,
                    hue: true,
                },
                projects: {
                    id: true,
                    title: true,
                    flowId: true,
                },
                teams: {
                    id: true,
                    title: true,
                },
                priority: true,
                count: true,
            },
        ],
    }),
);

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id }, query }) => {
        const ssrData = await fetcher(user, id, ...parseFilterValues(query));

        return ssrData.team
            ? {
                  fallback: {
                      [id]: ssrData,
                  },
              }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

export const TeamGoalsPage = ({ user, locale, ssrTime, fallback, params: { id } }: ExternalPageProps) => {
    const nextRouter = useNextRouter();
    const [preview, setPreview] = useState<Goal | null>(null);
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

    const {
        filterValues,
        setPriorityFilter,
        setStateFilter,
        setTagsFilter,
        setTagsFilterOutside,
        setEstimateFilter,
        setOwnerFilter,
        setProjectFilter,
        setFulltextFilter,
    } = useUrlFilterParams();

    const { data } = useSWR(id, () => fetcher(user, id, ...filterValues), {
        fallback,
        refreshInterval,
    });

    if (!data) return null;

    const team = data?.team;

    if (!team) return nextRouter.push('/404');

    const goals = data?.teamGoals;
    const meta = data?.teamGoalsMeta;
    const groups = useGrouppedGoals(goals);

    useEffect(() => {
        setCurrentProjectCache({
            id: team.id,
            title: team.title,
            description: team.description,
            flowId: team.flowId,
            kind: 'team',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    useEffect(() => {
        const isGoalDeletedAlready = preview && !goals?.some((g) => g.id === preview.id);

        if (isGoalDeletedAlready) setPreview(null);
    }, [goals, preview]);

    const onGoalPrewiewShow = useCallback(
        (goal: Goal): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey) return;

                e.preventDefault();
                setPreview(goal);
            },
        [],
    );

    const onGoalPreviewDestroy = useCallback(() => {
        setPreview(null);
    }, []);

    const selectedGoalResolver = useCallback((id: string) => id === preview?.id, [preview]);
    const pageTitle = tr
        .raw('title', {
            team: team?.title,
        })
        .join('');

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <TeamPageLayout actions team={team}>
                <FiltersPanel
                    count={meta?.count}
                    filteredCount={goals?.length ?? 0}
                    priority={meta?.priority}
                    states={meta?.states}
                    users={meta?.owners}
                    projects={meta?.projects}
                    tags={meta?.tags}
                    estimates={meta?.estimates}
                    filterValues={filterValues}
                    onSearchChange={setFulltextFilter}
                    onPriorityChange={setPriorityFilter}
                    onStateChange={setStateFilter}
                    onUserChange={setOwnerFilter}
                    onProjectChange={setProjectFilter}
                    onTagChange={setTagsFilter}
                    onEstimateChange={setEstimateFilter}
                />

                {nullable(groups.teams.length, () => (
                    <PageContent>
                        <GoalsGroup
                            goals={groups.teams[0].goals}
                            selectedResolver={selectedGoalResolver}
                            onClickProvider={onGoalPrewiewShow}
                            onTagClick={setTagsFilterOutside}
                        >
                            <GoalsGroupTeamTitle team={groups.teams[0]} />
                        </GoalsGroup>
                    </PageContent>
                ))}

                <PageContent>
                    {groups.projects.map((project) =>
                        nullable(project.goals.length, () => (
                            <GoalsGroup
                                key={project.data.id}
                                goals={project.goals}
                                selectedResolver={selectedGoalResolver}
                                onClickProvider={onGoalPrewiewShow}
                                onTagClick={setTagsFilterOutside}
                            >
                                <GoalsGroupProjectTitle project={project} />
                            </GoalsGroup>
                        )),
                    )}
                </PageContent>

                {nullable(preview, (p) => (
                    <GoalPreview goal={p} onClose={onGoalPreviewDestroy} onDelete={onGoalPreviewDestroy} />
                ))}
            </TeamPageLayout>
        </Page>
    );
};
