/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { nullable, Button } from '@taskany/bricks';

import { Goal, GoalsMetaOutput, Project } from '../../../graphql/@generated/genql';
import { createFetcher, refreshInterval } from '../../utils/createFetcher';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createFilterKeys } from '../../utils/hotkeys';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFilterResource } from '../../hooks/useFilterResource';
import { Priority } from '../../types/priority';
import { Page, PageContent } from '../Page';
import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { GoalsGroup, GoalsGroupProjectTitle } from '../GoalsGroup';
import { PageTitle } from '../PageTitle';
import { Nullish } from '../../types/void';
import { trpc } from '../../utils/trpcClient';
import { FilterById } from '../../../trpc/inferredTypes';

import { tr } from './GoalsPage.i18n';

const GoalPreview = dynamic(() => import('../GoalPreview/GoalPreview'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

export const goalsPageFetcher = createFetcher(
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
                    _count: {
                        comments: true,
                    },
                    _isEditable: true,
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

export const GoalsPage = ({ user, ssrTime, locale, fallback }: ExternalPageProps) => {
    const router = useRouter();
    const [preview, setPreview] = useState<Goal | null>(null);
    const { toggleFilterStar } = useFilterResource();

    const utils = trpc.useContext();

    const presetData = trpc.filter.getById.useQuery(router.query.filter as string, { enabled: !!router.query.filter });

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
        preset: presetData?.data,
    });

    const { data, isLoading } = useQuery(
        ['goals-page', router.query],
        () => goalsPageFetcher(user, ...Object.values(queryState)),
        {
            initialData: fallback as Awaited<ReturnType<typeof goalsPageFetcher>>,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const goals = data?.userGoals?.goals;
    const meta: GoalsMetaOutput | undefined = data?.userGoals?.meta;
    const userFilters = trpc.filter.getUserFilters.useQuery();
    const shadowPreset = userFilters.data?.filter((f) => f.params === queryString)[0];

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

    const onFilterStar = useCallback(async () => {
        if (currentPreset) {
            if (currentPreset._isOwner) {
                dispatchModalEvent(ModalEvent.FilterDeleteModal)();
            } else {
                await toggleFilterStar({
                    id: currentPreset.id,
                    direction: !currentPreset._isStarred,
                });
                await utils.filter.getById.invalidate();
            }
        } else {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
        }
    }, [currentPreset, toggleFilterStar, utils]);

    const onFilterCreated = useCallback(
        (data: Nullish<FilterById>) => {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
            setPreset(data.id);
        },
        [setPreset],
    );

    const onFilterDeleteCanceled = useCallback(() => {
        dispatchModalEvent(ModalEvent.FilterDeleteModal)();
    }, []);

    const onFilterDeleted = useCallback(
        (filter: FilterById) => {
            router.push(`${router.route}?${filter.params}`);
        },
        [router],
    );

    const defaultTitle = <PageTitle title={tr('Dashboard')} />;
    const presetTitle = <PageTitle title={tr('Dashboard')} subtitle={currentPreset?.title} />;

    const onShadowPresetTitleClick = useCallback(() => {
        if (shadowPreset) setPreset(shadowPreset.id);
    }, [setPreset, shadowPreset]);
    const shadowPresetTitle = (
        <PageTitle title={tr('Dashboard')} subtitle={shadowPreset?.title} onClick={onShadowPresetTitleClick} />
    );
    // eslint-disable-next-line no-nested-ternary
    const title = currentPreset ? presetTitle : shadowPreset ? shadowPresetTitle : defaultTitle;

    const description =
        currentPreset && currentPreset.description
            ? currentPreset.description
            : tr('This is your personal goals bundle');

    return (
        <Page user={user} ssrTime={ssrTime} locale={locale} title={tr('title')}>
            <CommonHeader title={title} description={description} />

            <FiltersPanel
                count={meta?.count}
                filteredCount={goals?.length ?? 0}
                priority={meta?.priority as Priority[]}
                states={meta?.states}
                users={meta?.owners}
                projects={meta?.projects}
                tags={meta?.tags}
                estimates={meta?.estimates}
                presets={userFilters.data}
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
        </Page>
    );
};

GoalsPage.whyDidYouRender = true;
