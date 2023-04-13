/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { nullable } from '@taskany/bricks';

import { Goal, GoalsMetaOutput, Project } from '../../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { Page, PageContent } from '../../Page';
import { CommonHeader } from '../../CommonHeader';
import { FiltersPanel } from '../../FiltersPanel';
import { parseFilterValues, useUrlFilterParams } from '../../../hooks/useUrlFilterParams';
import { GoalsGroup, GoalsGroupProjectTitle } from '../../GoalsGroup';

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
                goals: {
                    id: true,
                    title: true,
                    description: true,
                    projectId: true,
                    project: {
                        id: true,
                        title: true,
                        flowId: true,
                        parent: {
                            id: true,
                            title: true,
                            description: true,
                        },
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
                meta: {
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
                    estimates: {
                        id: true,
                        q: true,
                        y: true,
                        date: true,
                    },
                    priority: true,
                    count: true,
                },
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

    const goals = data?.userGoals?.goals;
    const meta: GoalsMetaOutput | undefined = data?.userGoals?.meta;

    if (!data?.userGoals) return null;

    const groupsMap =
        goals?.reduce<{ [key: string]: { project?: Project; goals: Goal[] } }>((r, g: Goal) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const k = g.projectId!;

            if (!r[k]) {
                r[k] = {
                    project: g.project,
                    goals: [],
                };
            }

            r[k].goals.push(g);
            return r;
        }, Object.create(null)) || {};

    const groups = Object.values(groupsMap);

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
                {groups?.map(
                    (group) =>
                        Boolean(group.goals.length) &&
                        group.project && (
                            <GoalsGroup
                                key={group.project.id}
                                goals={group.goals}
                                selectedResolver={selectedGoalResolver}
                                onClickProvider={onGoalPrewiewShow}
                                onTagClick={setTagsFilterOutside}
                            >
                                <GoalsGroupProjectTitle project={group.project} />
                            </GoalsGroup>
                        ),
                )}
            </PageContent>

            {nullable(preview, (p) => (
                <GoalPreview goal={p} onClose={onGoalPreviewDestroy} onDelete={onGoalPreviewDestroy} />
            ))}
        </Page>
    );
};
