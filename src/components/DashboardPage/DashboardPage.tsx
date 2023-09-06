/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { nullable, Button, ListView, ListViewItem } from '@taskany/bricks';
import { IconPlusCircleOutline } from '@taskany/icons';

import { refreshInterval } from '../../utils/config';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createFilterKeys } from '../../utils/hotkeys';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFilterResource } from '../../hooks/useFilterResource';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { Page, PageContent } from '../Page';
import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { Nullish } from '../../types/void';
import { trpc } from '../../utils/trpcClient';
import { FilterById, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { PageTitlePreset } from '../PageTitlePreset/PageTitlePreset';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { InlineTrigger } from '../InlineTrigger';
import { useFMPMetric } from '../../utils/telemetry';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { TreeView, TreeViewElement } from '../TreeView';
import { ProjectListItem } from '../ProjectListItem';
import { ProjectTreeNode, ProjectTreeNodeTitle } from '../ProjectTreeNode';
import { NextLink } from '../NextLink';
import { GoalListItem } from '../GoalListItem';
import { routes } from '../../hooks/router';

import { tr } from './DashboardPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

export const projectsLimit = 5;

export const DashboardPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const router = useRouter();
    const { toggleFilterStar } = useFilterResource();
    const { preset, shadowPreset, userFilters } = useFiltersPreset({ defaultPresetFallback });
    const { preview, setPreview } = useGoalPreview();
    const utils = trpc.useContext();

    const {
        currentPreset,
        queryState,
        queryString,
        setPriorityFilter,
        setStateFilter,
        setStateTypeFilter,
        setTagsFilter,
        setTagsFilterOutside,
        setEstimateFilter,
        setIssuerFilter,
        setOwnerFilter,
        setParticipantFilter,
        setProjectFilter,
        setStarredFilter,
        setWatchingFilter,
        setSortFilter,
        setFulltextFilter,
        resetQueryState,
        setPreset,
    } = useUrlFilterParams({
        preset,
    });

    const { data, isLoading, fetchNextPage, hasNextPage } = trpc.project.getUserProjectsWithGoals.useInfiniteQuery(
        {
            limit: projectsLimit,
            goalsQuery: queryState,
        },
        {
            getNextPageParam: (p) => p.nextCursor,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const pages = useMemo(() => data?.pages || [], [data?.pages]);

    const [groupsOnScreen, goals, totalGoalsCount] = useMemo(() => {
        const groups = pages?.[0]?.groups;

        const gr = pages.reduce<typeof groups>((acc, cur) => {
            acc.push(...cur.groups);
            return acc;
        }, []);

        return [gr, gr?.flatMap((group) => group.goals), pages?.[0]?.totalGoalsCount];
    }, [pages]);

    useFMPMetric(!!data);

    useEffect(() => {
        const isGoalDeletedAlready = preview && !goals?.some((g) => g.id === preview.id);

        if (isGoalDeletedAlready) setPreview(null);
    }, [goals, preview, setPreview]);

    const onGoalPreviewShow = useCallback(
        (goal: GoalByIdReturnType): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey || !goal?._shortId) return;

                e.preventDefault();
                setPreview(goal._shortId, goal);
            },
        [setPreview],
    );

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

    const title = (
        <PageTitlePreset
            activityId={user.activityId}
            currentPresetActivityId={currentPreset?.activityId}
            currentPresetActivityUserName={currentPreset?.activity?.user?.name}
            currentPresetTitle={currentPreset?.title}
            shadowPresetActivityId={shadowPreset?.activityId}
            shadowPresetActivityUserName={shadowPreset?.activity?.user?.name}
            shadowPresetId={shadowPreset?.id}
            shadowPresetTitle={shadowPreset?.title}
            title={tr('Dashboard')}
            setPreset={setPreset}
        />
    );

    const description =
        currentPreset && currentPreset.description
            ? currentPreset.description
            : tr('This is your personal goals bundle');

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <CommonHeader title={title} description={description} />

            <FiltersPanel
                loading={isLoading}
                total={totalGoalsCount}
                counter={goals?.length}
                queryState={queryState}
                queryString={queryString}
                preset={currentPreset}
                presets={userFilters}
                onSearchChange={setFulltextFilter}
                onIssuerChange={setIssuerFilter}
                onOwnerChange={setOwnerFilter}
                onParticipantChange={setParticipantFilter}
                onProjectChange={setProjectFilter}
                onStateChange={setStateFilter}
                onStateTypeChange={setStateTypeFilter}
                onTagChange={setTagsFilter}
                onEstimateChange={setEstimateFilter}
                onPriorityChange={setPriorityFilter}
                onStarredChange={setStarredFilter}
                onWatchingChange={setWatchingFilter}
                onPresetChange={setPreset}
                onFilterStar={onFilterStar}
                onSortChange={setSortFilter}
            >
                {nullable(Boolean(queryString) || preset, () => (
                    <Button text={tr('Reset')} onClick={resetQueryState} />
                ))}
            </FiltersPanel>

            <PageContent>
                <ListView>
                    <TreeView>
                        {groupsOnScreen?.map((group) => (
                            <ProjectTreeNode
                                key={group.project.id}
                                visible
                                renderTitle={({ visible }) => (
                                    <ListViewItem
                                        renderItem={({ active, hovered, ...attrs }) => (
                                            <NextLink href={routes.project(group.project.id)}>
                                                <ProjectTreeNodeTitle decorated={visible && !active && !hovered}>
                                                    <ProjectListItem
                                                        title={group.project.title}
                                                        owner={group.project.activity}
                                                        participants={group.project.participants}
                                                        starred={group.project._isStarred}
                                                        watching={group.project._isWatching}
                                                        averageScore={group.project.averageScore}
                                                        focused={active}
                                                        hovered={hovered}
                                                        {...attrs}
                                                    />
                                                </ProjectTreeNodeTitle>
                                            </NextLink>
                                        )}
                                    />
                                )}
                            >
                                {group.goals.length ? (
                                    group.goals.map((goal) => (
                                        <TreeViewElement key={goal.id}>
                                            <ListViewItem
                                                renderItem={({ active, ...attrs }) => (
                                                    <NextLink href={routes.goal(goal._shortId)}>
                                                        <GoalListItem
                                                            updatedAt={goal.updatedAt}
                                                            state={goal.state}
                                                            title={goal.title}
                                                            issuer={goal.activity}
                                                            owner={goal.owner}
                                                            tags={goal.tags}
                                                            priority={goal.priority}
                                                            comments={goal._count?.comments}
                                                            estimate={goal._lastEstimate}
                                                            participants={goal.participants}
                                                            starred={goal._isStarred}
                                                            watching={goal._isWatching}
                                                            achivedCriteriaWeight={goal._achivedCriteriaWeight}
                                                            onClick={onGoalPreviewShow(goal)}
                                                            onTagClick={setTagsFilterOutside}
                                                            focused={active || selectedGoalResolver(goal.id)}
                                                            {...attrs}
                                                        />
                                                    </NextLink>
                                                )}
                                            />
                                        </TreeViewElement>
                                    ))
                                ) : (
                                    <TreeViewElement>
                                        <InlineTrigger
                                            text={tr('Create goal')}
                                            icon={<IconPlusCircleOutline noWrap size="s" />}
                                            onClick={dispatchModalEvent(ModalEvent.GoalCreateModal, {
                                                id: group.project.id,
                                            })}
                                        />
                                    </TreeViewElement>
                                )}
                            </ProjectTreeNode>
                        ))}
                    </TreeView>
                </ListView>

                {nullable(hasNextPage, () => (
                    <LoadMoreButton onClick={() => fetchNextPage()} />
                ))}
            </PageContent>

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
