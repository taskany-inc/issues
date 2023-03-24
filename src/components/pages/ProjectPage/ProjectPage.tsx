/* eslint-disable react-hooks/rules-of-hooks */
import { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter as useNextRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { nullable } from '@common/utils/nullable';

import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { Goal, GoalsMetaOutput } from '../../../../graphql/@generated/genql';
import { GoalListItem } from '../../GoalListItem';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { FiltersPanel } from '../../FiltersPanel';
import { parseFilterValues, useUrlFilterParams } from '../../../hooks/useUrlFilterParams';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useWillUnmount } from '../../../hooks/useWillUnmount';
import { ProjectPageLayout } from '../../ProjectPageLayout';
import { Page } from '../../Page';
import { GoalList } from '../../GoalList';

import { tr } from './ProjectPage.i18n';

const GoalPreview = dynamic(() => import('../../GoalPreview'));

const fetcher = createFetcher((_, key: string, priority = [], states = [], tags = [], owner = [], query = '') => ({
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
            flowId: true,
            flow: {
                id: true,
            },
            teams: {
                key: true,
                title: true,
                description: true,
                _count: {
                    projects: true,
                },
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
            _count: {
                stargizers: true,
            },
            _isStarred: true,
            _isWatching: true,
        },
    ],
    projectGoals: [
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
    projectGoalsMeta: [
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

        return ssrData.project
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

export const ProjectPage = ({
    user,
    locale,
    ssrTime,
    fallback,
    params: { key },
}: ExternalPageProps<{ key: string }>) => {
    const nextRouter = useNextRouter();
    const [preview, setPreview] = useState<Goal | null>(null);
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

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

    const project = data?.project;

    if (!project) return nextRouter.push('/404');

    const goals = data?.projectGoals;
    const meta: GoalsMetaOutput | undefined = data?.projectGoalsMeta;

    useEffect(() => {
        const isGoalDeletedAlready = preview && !goals?.some((g) => g.id === preview.id);

        if (isGoalDeletedAlready) setPreview(null);
    }, [goals, preview]);

    useEffect(() => {
        setCurrentProjectCache({
            id: project.id,
            key: project.key,
            title: project.title,
            description: project.description,
            flowId: project.flowId,
            kind: 'project',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

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
            project: project.title,
        })
        .join('');

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <ProjectPageLayout actions project={project}>
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

                <GoalList>
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
                                focused={selectedGoalResolver(g.id)}
                                key={g.id}
                                onClick={onGoalPrewiewShow(g)}
                                onTagClick={setTagsFilterOutside}
                            />
                        )),
                    )}
                </GoalList>

                {nullable(preview, (p) => (
                    <GoalPreview goal={p} onClose={onGoalPreviewDestroy} onDelete={onGoalPreviewDestroy} />
                ))}
            </ProjectPageLayout>
        </Page>
    );
};
