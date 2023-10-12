import React, { useCallback } from 'react';
import { FiltersMenuItem, nullable } from '@taskany/bricks';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { trpc } from '../../utils/trpcClient';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { Page } from '../Page';
import { CommonHeader } from '../CommonHeader';
import { PageTitlePreset } from '../PageTitlePreset/PageTitlePreset';
import { safeGetUserName } from '../../utils/getUserName';
import { FilteredPage } from '../FilteredPage';
import { FlatGoalList } from '../FlatGoalList';
import { GroupedGoalList } from '../GroupedGoalList';

import { tr } from './GoalsPage.i18n';

export const GoalsPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const utils = trpc.useContext();

    const { preset, shadowPreset, userFilters } = useFiltersPreset({
        defaultPresetFallback,
    });

    const { currentPreset, queryState, setTagsFilterOutside, setPreset, setGroupedView } = useUrlFilterParams({
        preset,
    });

    const { data } = trpc.goal.getGoalsCount.useQuery({
        query: queryState,
    });

    const onFilterStar = useCallback(async () => {
        await utils.filter.getById.invalidate();
    }, [utils]);

    const description =
        currentPreset && currentPreset.description
            ? currentPreset.description
            : tr('These are goals across all projects');

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <CommonHeader
                title={
                    <PageTitlePreset
                        activityId={user.activityId}
                        currentPresetActivityId={currentPreset?.activityId}
                        currentPresetActivityUserName={safeGetUserName(currentPreset?.activity)}
                        currentPresetTitle={currentPreset?.title}
                        shadowPresetActivityId={shadowPreset?.activityId}
                        shadowPresetActivityUserName={safeGetUserName(shadowPreset?.activity)}
                        shadowPresetId={shadowPreset?.id}
                        shadowPresetTitle={shadowPreset?.title}
                        title={tr('Goals')}
                        setPreset={setPreset}
                    />
                }
                description={description}
            />
            <FilteredPage
                total={data?.count || 0}
                counter={data?.filtered || 0}
                filterPreset={currentPreset}
                userFilters={userFilters}
                onFilterStar={onFilterStar}
                isLoading={false}
                filterControls={nullable(
                    !queryState?.groupBy,
                    () => (
                        <FiltersMenuItem onClick={() => setGroupedView('project')}>
                            {tr('Group by project')}
                        </FiltersMenuItem>
                    ),
                    <FiltersMenuItem onClick={() => setGroupedView()}>{tr('Reset grouping')}</FiltersMenuItem>,
                )}
            >
                {nullable(
                    !queryState?.groupBy,
                    () => (
                        <FlatGoalList queryState={queryState} setTagFilterOutside={setTagsFilterOutside} />
                    ),
                    <GroupedGoalList queryState={queryState} setTagFilterOutside={setTagsFilterOutside} />,
                )}
            </FilteredPage>
        </Page>
    );
};
