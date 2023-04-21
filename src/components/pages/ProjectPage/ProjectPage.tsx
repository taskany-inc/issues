/* eslint-disable react-hooks/rules-of-hooks */
import { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import useSWR, { unstable_serialize } from 'swr';
import { useRouter as useNextRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Button, nullable } from '@taskany/bricks';

import { Filter, Goal, Project, ProjectDeepOutput } from '../../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { ModalEvent, dispatchModalEvent } from '../../../utils/dispatchModal';
import { createFilterKeys } from '../../../utils/hotkeys';
import { Priority } from '../../../types/priority';
import { parseFilterValues, useUrlFilterParams } from '../../../hooks/useUrlFilterParams';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useWillUnmount } from '../../../hooks/useWillUnmount';
import { FiltersPanel } from '../../FiltersPanel';
import { ProjectPageLayout } from '../../ProjectPageLayout';
import { Page, PageContent } from '../../Page';
import { GoalsGroup, GoalsGroupProjectTitle } from '../../GoalsGroup';
import { PageTitle } from '../../PageTitle';

import { tr } from './ProjectPage.i18n';

const GoalPreview = dynamic(() => import('../../GoalPreview'));
const ModalOnEvent = dynamic(() => import('../../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../../FilterDeleteForm/FilterDeleteForm'));

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
        userFilters: {
            id: true,
            title: true,
            description: true,
            mode: true,
            params: true,
        },
    }),
);

const filterFetcher = createFetcher((_, id = '') => ({
    filter: [
        {
            data: {
                id,
            },
        },
        {
            id: true,
            title: true,
            description: true,
            mode: true,
            params: true,
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id }, query }) => {
        const { filter: preset } = query.filter ? await filterFetcher(user, query.filter) : { filter: null };

        const ssrData = await fetcher(
            user,
            id,
            ...Object.values(
                parseFilterValues(preset ? Object.fromEntries(new URLSearchParams(preset.params)) : query),
            ),
        );

        return ssrData.project
            ? {
                  preset,
                  fallback: {
                      [unstable_serialize(query)]: ssrData,
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

export const ProjectPage = ({ user, locale, ssrTime, fallback, preset, params: { id } }: ExternalPageProps) => {
    const nextRouter = useNextRouter();
    const [preview, setPreview] = useState<Goal | null>(null);
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

    const {
        currentPreset,
        queryState,
        queryString,
        setPriorityFilter,
        setStateFilter,
        setTagsFilter,
        setTagsFilterOutside,
        setEstimateFilter,
        setOwnerFilter,
        setProjectFilter,
        setFulltextFilter,
        resetQueryState,
        setPreset,
    } = useUrlFilterParams({
        preset,
    });

    const { data, isLoading } = useSWR(
        unstable_serialize(nextRouter.query),
        () => fetcher(user, id, ...Object.values(queryState)),
        {
            fallback,
            keepPreviousData: true,
            refreshInterval,
        },
    );

    const project = data?.project;
    const deepInfo: ProjectDeepOutput | undefined = data?.projectDeepInfo;
    const userFilters = data?.userFilters;
    const shadowPreset = userFilters?.filter((f) => f.params === queryString)[0];

    const groupsMap =
        deepInfo?.goals?.reduce<{ [key: string]: { project?: Project; goals: Goal[] } }>((r, g) => {
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

    useEffect(() => {
        if (project) {
            setCurrentProjectCache({
                id: project.id,
                title: project.title,
                description: project.description,
                flowId: project.flowId,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const onFilterStar = useCallback(() => {
        currentPreset
            ? dispatchModalEvent(ModalEvent.FilterDeleteModal)()
            : dispatchModalEvent(ModalEvent.FilterCreateModal)();
    }, [currentPreset]);

    const onFilterCreated = useCallback(
        (data: Partial<Filter>) => {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
            setPreset(data.id);
        },
        [setPreset],
    );

    const onFilterDeleteCanceled = useCallback(() => {
        dispatchModalEvent(ModalEvent.FilterDeleteModal)();
    }, []);

    const onFilterDeleted = useCallback(
        (filter: Filter) => {
            nextRouter.push(`${nextRouter.route}?${filter.params}`);
        },
        [nextRouter],
    );

    const pageTitle = tr
        .raw('title', {
            project: project?.title,
        })
        .join('');

    const defaultTitle = <PageTitle title={project?.title} />;
    const presetTitle = <PageTitle title={project?.title} subtitle={currentPreset?.title} />;

    const onShadowPresetTitleClick = useCallback(() => {
        if (shadowPreset) setPreset(shadowPreset.id);
    }, [setPreset, shadowPreset]);
    const shadowPresetTitle = (
        <PageTitle title={project?.title} subtitle={shadowPreset?.title} onClick={onShadowPresetTitleClick} />
    );
    // eslint-disable-next-line no-nested-ternary
    const title = currentPreset ? presetTitle : shadowPreset ? shadowPresetTitle : defaultTitle;
    const description = currentPreset && currentPreset.description ? currentPreset.description : project?.description;

    if (!project) return null;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <ProjectPageLayout actions project={project} title={title} description={description}>
                <FiltersPanel
                    count={deepInfo?.meta?.count}
                    filteredCount={deepInfo?.goals?.length ?? 0}
                    priority={deepInfo?.meta?.priority as Priority[]}
                    states={deepInfo?.meta?.states}
                    users={deepInfo?.meta?.owners}
                    tags={deepInfo?.meta?.tags}
                    estimates={deepInfo?.meta?.estimates}
                    projects={deepInfo?.meta?.projects}
                    presets={userFilters}
                    currentPreset={currentPreset}
                    queryState={queryState}
                    queryString={queryString}
                    loading={isLoading}
                    onSearchChange={setFulltextFilter}
                    onPriorityChange={setPriorityFilter}
                    onStateChange={setStateFilter}
                    onUserChange={setOwnerFilter}
                    onProjectChange={setProjectFilter}
                    onTagChange={setTagsFilter}
                    onEstimateChange={setEstimateFilter}
                    onPresetChange={setPreset}
                    onFilterStar={onFilterStar}
                >
                    {Boolean(queryString) && <Button text={tr('Reset')} onClick={resetQueryState} />}
                </FiltersPanel>

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

                {nullable(queryString, (params) => (
                    <ModalOnEvent event={ModalEvent.FilterCreateModal} hotkeys={createFilterKeys}>
                        <FilterCreateForm mode="User" params={params} onSubmit={onFilterCreated} />
                    </ModalOnEvent>
                ))}

                {nullable(currentPreset, (cP) => (
                    <ModalOnEvent view="warn" event={ModalEvent.FilterDeleteModal}>
                        <FilterDeleteForm preset={cP} onSubmit={onFilterDeleted} onCancel={onFilterDeleteCanceled} />
                    </ModalOnEvent>
                ))}
            </ProjectPageLayout>
        </Page>
    );
};
