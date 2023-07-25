/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { nullable, Button } from '@taskany/bricks';

import { refreshInterval } from '../../utils/config';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { createFilterKeys } from '../../utils/hotkeys';
import { trpc } from '../../utils/trpcClient';
import { FilterById, GoalByIdReturnType, GoalBatchReturnType } from '../../../trpc/inferredTypes';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFilterResource } from '../../hooks/useFilterResource';
import { Page, PageContent } from '../Page';
import { CommonHeader } from '../CommonHeader';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { GoalListItem, GoalsListContainer } from '../GoalListItem';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { Nullish } from '../../types/void';
import { PageTitlePreset } from '../PageTitlePreset/PageTitlePreset';
import { useGoalPreview } from '../GoalPreview/GoalPreview';

import { tr } from './GoalsPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

const pageSize = 20;

export const GoalsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const router = useRouter();
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
        preset: presetData?.data,
    });

    const [, setPage] = useState(0);
    const { data, fetchNextPage, isLoading } = trpc.goal.getBatch.useInfiniteQuery(
        {
            limit: pageSize,
            query: queryState,
        },
        {
            getNextPageParam: (p) => p.nextCursor,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const onFetchNextPage = useCallback(() => {
        fetchNextPage();
        setPage((prev) => prev++);
    }, [fetchNextPage]);

    const pages = data?.pages;
    const goalsOnScreen = useMemo(
        () => pages?.reduce<GoalBatchReturnType['items']>((flatArr, curr) => [...flatArr, ...curr.items], []),
        [pages],
    );
    const meta = data?.pages?.[0].meta;
    const userFilters = trpc.filter.getUserFilters.useQuery(undefined, {
        keepPreviousData: true,
        staleTime: refreshInterval,
    });
    const shadowPreset = userFilters.data?.filter((f) => f.params === queryString)[0];

    const { preview, setGoalPreview } = useGoalPreview();

    useEffect(() => {
        const isGoalDeletedAlready = preview && !goalsOnScreen?.some((g) => g.id === preview.id);

        if (isGoalDeletedAlready) setGoalPreview(null);
    }, [goalsOnScreen, preview, setGoalPreview]);

    const onGoalPrewiewShow = useCallback(
        (goal: GoalByIdReturnType): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey) return;

                e.preventDefault();
                setGoalPreview(goal);
            },
        [setGoalPreview],
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
            currentPresetActivityUserName={currentPreset?.activity.user?.name}
            currentPresetTitle={currentPreset?.title}
            shadowPresetActivityId={shadowPreset?.activityId}
            shadowPresetActivityUserName={shadowPreset?.activity.user?.name}
            shadowPresetId={shadowPreset?.id}
            shadowPresetTitle={shadowPreset?.title}
            title={tr('Goals')}
            setPreset={setPreset}
        />
    );

    const description =
        currentPreset && currentPreset.description
            ? currentPreset.description
            : tr('These are goals across all projects');

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <CommonHeader title={title} description={description} />

            <FiltersPanel
                loading={isLoading}
                total={meta?.count}
                counter={goalsOnScreen?.length}
                queryState={queryState}
                queryString={queryString}
                preset={currentPreset}
                presets={userFilters.data}
                onSearchChange={setFulltextFilter}
                onIssuerChange={setIssuerFilter}
                onOwnerChange={setOwnerFilter}
                onParticipantChange={setParticipantFilter}
                onProjectChange={setProjectFilter}
                onStateChange={setStateFilter}
                onTagChange={setTagsFilter}
                onEstimateChange={setEstimateFilter}
                onPriorityChange={setPriorityFilter}
                onStarredChange={setStarredFilter}
                onWatchingChange={setWatchingFilter}
                onPresetChange={setPreset}
                onFilterStar={onFilterStar}
                onSortChange={setSortFilter}
            >
                {nullable(queryString, () => (
                    <Button text={tr('Reset')} onClick={resetQueryState} />
                ))}
            </FiltersPanel>

            <PageContent>
                <GoalsListContainer>
                    {goalsOnScreen?.map((g) => (
                        <GoalListItem
                            createdAt={g.createdAt}
                            updatedAt={g.updatedAt}
                            id={g.id}
                            shortId={g._shortId}
                            projectId={g.projectId}
                            state={g.state}
                            title={g.title}
                            issuer={g.activity}
                            owner={g.owner}
                            tags={g.tags}
                            priority={g.priority}
                            comments={g._count?.comments}
                            estimate={g.estimate?.length ? g.estimate[g.estimate.length - 1] : undefined}
                            participants={g.participants}
                            starred={g._isStarred}
                            watching={g._isWatching}
                            achivedCriteriaWeight={g._achivedCriteriaWeight}
                            key={g.id}
                            focused={selectedGoalResolver(g.id)}
                            onClick={onGoalPrewiewShow(g as GoalByIdReturnType)}
                            onTagClick={setTagsFilterOutside}
                        />
                    ))}
                </GoalsListContainer>

                <LoadMoreButton onClick={onFetchNextPage} />
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
