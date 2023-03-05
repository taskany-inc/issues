/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useRouter as useNextRouter } from 'next/router';

import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { Goal } from '../../../../graphql/@generated/genql';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { nullable } from '../../../utils/nullable';
import { FiltersPanel } from '../../../components/FiltersPanel';
import { parseFilterValues, useUrlFilterParams } from '../../../hooks/useUrlFilterParams';
import { TeamPageLayout } from '../../../components/TeamPageLayout';
import { Page, PageContent } from '../../../components/Page';
import { GoalsGroup, GoalsGroupProjectTitle, GoalsGroupTeamTitle } from '../../../components/GoalGroup';
import { useGrouppedGoals } from '../../../hooks/useGrouppedGoals';

const GoalPreview = dynamic(() => import('../../../components/GoalPreview'));

const fetcher = createFetcher((_, key, priority = [], states = [], tags = [], owner = [], query = '') => ({
    team: [
        {
            key,
        },
        {
            id: true,
            key: true,
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
    teamGoals: [
        {
            data: {
                key,
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
    teamGoalsMeta: [
        {
            data: {
                key,
                priority: [],
                states: [],
                tags: [],
                owner: [],
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
            priority: true,
            count: true,
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key }, query }) => {
        const ssrData = await fetcher(user, key, ...parseFilterValues(query));

        return ssrData.team
            ? {
                  fallback: {
                      [key]: ssrData,
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

const TeamGoalsPage = ({ user, locale, ssrTime, fallback, params: { key } }: ExternalPageProps<{ key: string }>) => {
    const t = useTranslations('teams');
    const nextRouter = useNextRouter();
    const [preview, setPreview] = useState<Goal | null>(null);

    const {
        filterValues,
        setPriorityFilter,
        setStateFilter,
        setTagsFilter,
        setTagsFilterOutside,
        setOwnerFilter,
        setFulltextFilter,
    } = useUrlFilterParams();

    const { data } = useSWR(key, () => fetcher(user, key, ...filterValues), {
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
                    count={meta?.count}
                    filteredCount={goals?.length ?? 0}
                    priority={meta?.priority}
                    states={meta?.states}
                    users={meta?.owners}
                    tags={meta?.tags}
                    filterValues={filterValues}
                    onSearchChange={setFulltextFilter}
                    onPriorityChange={setPriorityFilter}
                    onStateChange={setStateFilter}
                    onUserChange={setOwnerFilter}
                    onTagChange={setTagsFilter}
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

export default TeamGoalsPage;
