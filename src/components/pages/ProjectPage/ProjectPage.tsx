/* eslint-disable react-hooks/rules-of-hooks */
import { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter as useNextRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { nullable } from '@taskany/bricks';

import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { Goal, Project, ProjectDeepOutput } from '../../../../graphql/@generated/genql';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { FiltersPanel } from '../../FiltersPanel';
import { parseFilterValues, useUrlFilterParams } from '../../../hooks/useUrlFilterParams';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useWillUnmount } from '../../../hooks/useWillUnmount';
import { ProjectPageLayout } from '../../ProjectPageLayout';
import { Page, PageContent } from '../../Page';
import { GoalsGroup, GoalsGroupProjectTitle } from '../../GoalsGroup';

import { tr } from './ProjectPage.i18n';

const GoalPreview = dynamic(() => import('../../GoalPreview'));

const goalFields = {
    id: true,
    title: true,
    description: true,
    priority: true,
    projectId: true,
    project: {
        id: true,
        title: true,
        description: true,
        parent: {
            id: true,
            title: true,
            description: true,
        },
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
    createdAt: true,
    updatedAt: true,
} as const;

const fetcher = createFetcher(
    (_, id: string, priority = [], states = [], tags = [], estimates = [], owner = [], projects = [], query = '') => ({
        project: [
            {
                data: {
                    id,
                },
            },
            {
                id: true,
                title: true,
                description: true,
                activityId: true,
                parent: {
                    id: true,
                    title: true,
                    description: true,
                },
                children: {
                    id: true,
                    title: true,
                    description: true,
                    parent: {
                        id: true,
                        title: true,
                        description: true,
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
                    watchers: true,
                    participants: true,
                    children: true,
                },
                _isStarred: true,
                _isWatching: true,
            },
        ],
        projectDeepInfo: [
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
                goals: {
                    ...goalFields,
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
    async ({ user, params: { id }, query }) => {
        const ssrData = await fetcher(user, id, ...parseFilterValues(query));

        return ssrData.project
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

export const ProjectPage = ({ user, locale, ssrTime, fallback, params: { id } }: ExternalPageProps) => {
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
        setFulltextFilter,
    } = useUrlFilterParams();

    const { data } = useSWR(id, () => fetcher(user, id, ...filterValues), {
        fallback,
        refreshInterval,
    });

    if (!data) return null;

    const project = data?.project;

    if (!project) return nextRouter.push('/404');

    const deepInfo: ProjectDeepOutput | undefined = data?.projectDeepInfo;

    if (!deepInfo) return null;

    const groupsMap =
        deepInfo.goals?.reduce<{ [key: string]: { project?: Project; goals: Goal[] } }>((r, g) => {
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

    // sort groups to make root project first
    const groups = Object.values(groupsMap).sort((a) => (a.project?.id === id ? -1 : 1));

    useEffect(() => {
        const isGoalDeletedAlready = preview && !deepInfo?.goals?.some((g) => g.id === preview.id);

        if (isGoalDeletedAlready) setPreview(null);
    }, [deepInfo, preview]);

    useEffect(() => {
        setCurrentProjectCache({
            id: project.id,
            title: project.title,
            description: project.description,
            flowId: project.flowId,
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
                    count={deepInfo.meta?.count}
                    filteredCount={deepInfo.goals?.length ?? 0}
                    priority={deepInfo.meta?.priority}
                    states={deepInfo.meta?.states}
                    users={deepInfo.meta?.owners}
                    tags={deepInfo.meta?.tags}
                    estimates={deepInfo.meta?.estimates}
                    filterValues={filterValues}
                    onSearchChange={setFulltextFilter}
                    onPriorityChange={setPriorityFilter}
                    onStateChange={setStateFilter}
                    onUserChange={setOwnerFilter}
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
            </ProjectPageLayout>
        </Page>
    );
};
