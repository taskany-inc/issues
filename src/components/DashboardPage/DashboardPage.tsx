/* eslint-disable react-hooks/rules-of-hooks */
import React, { MouseEventHandler, useCallback, useEffect, useMemo } from 'react';
import { nullable, Table } from '@taskany/bricks';

import { refreshInterval } from '../../utils/config';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { Page } from '../Page';
import { CommonHeader } from '../CommonHeader';
import { GoalsGroup } from '../GoalsGroup';
import { trpc } from '../../utils/trpcClient';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { PageTitlePreset } from '../PageTitlePreset/PageTitlePreset';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { useFMPMetric } from '../../utils/telemetry';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { InlineCreateGoalControl } from '../InlineCreateGoalControl/InlineCreateGoalControl';
import { safeGetUserName } from '../../utils/getUserName';
import { FilteredPage } from '../FilteredPage/FilteredPage';

import { tr } from './DashboardPage.i18n';

export const projectsLimit = 5;

export const DashboardPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const utils = trpc.useContext();

    const { preset, shadowPreset, userFilters } = useFiltersPreset({ defaultPresetFallback });

    const { currentPreset, queryState, setTagsFilterOutside, setPreset } = useUrlFilterParams({
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

        return [gr, gr.flatMap((group) => group.goals), pages?.[0]?.totalGoalsCount];
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
        await utils.filter.getById.invalidate();
    }, [utils]);

    const title = (
        <PageTitlePreset
            activityId={user.activityId}
            currentPresetActivityId={currentPreset?.activityId}
            currentPresetActivityUserName={safeGetUserName(currentPreset?.activity)}
            currentPresetTitle={currentPreset?.title}
            shadowPresetActivityId={shadowPreset?.activityId}
            shadowPresetActivityUserName={safeGetUserName(shadowPreset?.activity)}
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
            <FilteredPage
                total={totalGoalsCount}
                counter={goals?.length}
                filterPreset={currentPreset}
                userFilters={userFilters}
                onFilterStar={onFilterStar}
                isLoading={isLoading}
            >
                <Table>
                    {groupsOnScreen?.map((group) => (
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
                    ))}
                </Table>

                {nullable(hasNextPage, () => (
                    <LoadMoreButton onClick={() => fetchNextPage()} />
                ))}
            </FilteredPage>
        </Page>
    );
};
