/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { nullable, Button, Table } from '@taskany/bricks';

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
import { GoalsGroup } from '../GoalsGroup';
import { Nullish } from '../../types/void';
import { trpc } from '../../utils/trpcClient';
import { FilterById, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { PageTitlePreset } from '../PageTitlePreset/PageTitlePreset';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { useFMPMetric } from '../../utils/telemetry';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { InlineCreateGoalControl } from '../InlineCreateGoalControl/InlineCreateGoalControl';
import { getUserName } from '../../utils/getUserName';

import { tr } from './DashboardPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

export const projectsLimit = 5;

export const DashboardPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const router = useRouter();
    const { toggleFilterStar } = useFilterResource();

    const utils = trpc.useContext();

    const { preset, shadowPreset, userFilters } = useFiltersPreset({ defaultPresetFallback });

    const {
        currentPreset,
        queryState,
        queryString,
        setTagsFilterOutside,
        setEstimateFilter,
        setStarredFilter,
        setWatchingFilter,
        setFulltextFilter,
        setLimitFilter,
        resetQueryState,
        setPreset,
        batchQueryState,
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

    const { setPreview, preview } = useGoalPreview();

    useEffect(() => {
        const isGoalDeletedAlready = preview && !goals?.some((g) => g.id === preview.id);

        if (isGoalDeletedAlready) setPreview(null);
    }, [goals, preview, setPreview]);

    const onGoalPrewiewShow = useCallback(
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
            currentPresetActivityUserName={getUserName(currentPreset?.activity?.user)}
            currentPresetTitle={currentPreset?.title}
            shadowPresetActivityId={shadowPreset?.activityId}
            shadowPresetActivityUserName={getUserName(shadowPreset?.activity?.user)}
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
                onEstimateChange={setEstimateFilter}
                onStarredChange={setStarredFilter}
                onWatchingChange={setWatchingFilter}
                onPresetChange={setPreset}
                onFilterStar={onFilterStar}
                onFilterApply={batchQueryState}
                onLimitChange={setLimitFilter}
            >
                {(Boolean(queryString) || preset) && <Button text={tr('Reset')} onClick={resetQueryState} />}
            </FiltersPanel>

            <PageContent>
                <Table>
                    {groupsOnScreen?.map(
                        (group) =>
                            (queryString ? Boolean(group.goals.length) : true) && (
                                <React.Fragment key={group.project.id}>
                                    <GoalsGroup
                                        goals={group.goals as NonNullable<GoalByIdReturnType>[]}
                                        selectedResolver={selectedGoalResolver}
                                        onClickProvider={onGoalPrewiewShow}
                                        onTagClick={setTagsFilterOutside}
                                        project={group.project}
                                    />
                                    {nullable(!group.goals.length, () => (
                                        <InlineCreateGoalControl projectId={group.project.id} />
                                    ))}
                                </React.Fragment>
                            ),
                    )}
                </Table>

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
