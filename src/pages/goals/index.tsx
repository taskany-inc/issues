import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { Goal, GoalsMetaOutput } from '../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { Page, PageContent } from '../../components/Page';
import { nullable } from '../../utils/nullable';
import { CommonHeader } from '../../components/CommonHeader';
import { FiltersPanel } from '../../components/FiltersPanel';
import { parseFilterValues, useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useGrouppedGoals } from '../../hooks/useGrouppedGoals';
import { GoalsGroup, GoalsGroupProjectTitle, GoalsGroupTeamTitle } from '../../components/GoalGroup';

const GoalPreview = dynamic(() => import('../../components/GoalPreview'));

const fetcher = createFetcher((_, priority = [], states = [], tags = [], owner = [], query = '') => ({
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
    async ({ user, query }) => ({
        ssrData: await fetcher(user, ...parseFilterValues(query)),
    }),
    {
        private: true,
    },
);

const GoalsPage = ({
    user,
    ssrTime,
    locale,
    ssrData: fallbackData,
}: ExternalPageProps<Awaited<ReturnType<typeof fetcher>>>) => {
    const t = useTranslations('goals.index');
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

    const { data } = useSWR([user, ...filterValues], fetcher, {
        refreshInterval,
        fallbackData,
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
        <Page user={user} ssrTime={ssrTime} locale={locale} title={t('title')}>
            <CommonHeader title={t('Dashboard')} description={t('This is your personal goals bundle')} />

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

export default GoalsPage;
