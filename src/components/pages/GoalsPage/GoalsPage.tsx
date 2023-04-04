import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

import { Goal, GoalsMetaOutput } from '../../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { Page, PageContent } from '../../Page';
import { nullable } from '../../../utils/nullable';
import { CommonHeader } from '../../CommonHeader';
import { FiltersPanel } from '../../FiltersPanel';
import { parseFilterValues, useUrlFilterParams } from '../../../hooks/useUrlFilterParams';
import { useGrouppedGoals } from '../../../hooks/useGrouppedGoals';
import { GoalsGroup, GoalsGroupProjectTitle, GoalsGroupTeamTitle } from '../../GoalGroup';

import { tr } from './GoalsPage.i18n';

const GoalPreview = dynamic(() => import('../../GoalPreview'));

const fetcher = createFetcher(
    (_, priority = [], states = [], tags = [], estimates = [], owner = [], projects = [], query = '') => ({
        userGoals: [
            {
                data: {
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
                    key: true,
                    title: true,
                    flowId: true,
                    teams: {
                        id: true,
                        key: true,
                        title: true,
                    },
                },
                team: {
                    id: true,
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
        userGoalsMeta: [
            {
                data: {
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
                    key: true,
                    title: true,
                    flowId: true,
                },
                teams: {
                    id: true,
                    key: true,
                    title: true,
                },
                estimates: {
                    id: true,
                    q: true,
                    y: true,
                    date: true,
                },
                priority: true,
                count: true,
            },
        ],
    }),
);

export const getServerSideProps = declareSsrProps(
    async ({ user, query }) => ({
        fallback: {
            'goals/index': await fetcher(user, ...parseFilterValues(query)),
        },
    }),
    {
        private: true,
    },
);

export const GoalsPage = ({ user, ssrTime, locale, fallback }: ExternalPageProps) => {
    const [preview, setPreview] = useState<Goal | null>(null);

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

    const { data } = useSWR('goals/index', () => fetcher(user, ...filterValues), {
        fallback,
        refreshInterval,
    });

    const goals = data?.userGoals;
    const meta: GoalsMetaOutput | undefined = data?.userGoalsMeta;
    const groups = useGrouppedGoals(goals);

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

    return (
        <Page user={user} ssrTime={ssrTime} locale={locale} title={tr('title')}>
            <CommonHeader title={tr('Dashboard')} description={tr('This is your personal goals bundle')} />

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

            <PageContent>
                {groups.teams.map((team) =>
                    nullable(team.goals.length, () => (
                        <GoalsGroup
                            key={team.data.id}
                            goals={team.goals}
                            selectedResolver={selectedGoalResolver}
                            onClickProvider={onGoalPrewiewShow}
                            onTagClick={setTagsFilterOutside}
                        >
                            <GoalsGroupTeamTitle team={team} />
                        </GoalsGroup>
                    )),
                )}

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
        </Page>
    );
};
