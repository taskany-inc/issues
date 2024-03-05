import React, { useCallback } from 'react';
import { FiltersMenuItem, nullable } from '@taskany/bricks';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { trpc } from '../../utils/trpcClient';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { Page } from '../Page/Page';
import { FilteredPage } from '../FilteredPage/FilteredPage';
import { getPageTitle } from '../../utils/getPageTitle';
import { GroupedGoalList } from '../GroupedGoalList';
import { FlatGoalList } from '../FlatGoalList';

import { tr } from './GoalsPage.i18n';

export const GoalsPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const utils = trpc.useContext();

    const { preset, userFilters } = useFiltersPreset({
        defaultPresetFallback,
    });

    const { currentPreset, queryState, groupBy, setTagsFilterOutside, setGroupBy } = useUrlFilterParams({
        preset,
    });

    const { data } = trpc.goal.getGoalsCount.useQuery({
        query: queryState,
    });

    const onFilterStar = useCallback(async () => {
        await utils.filter.getById.invalidate();
    }, [utils]);

    const groupedView = groupBy === 'project';

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <FilteredPage
                title={getPageTitle({
                    title: tr('Goals'),
                    shadowPresetTitle: currentPreset?.title,
                    currentPresetTitle: currentPreset?.title,
                })}
                total={data?.count || 0}
                counter={data?.filtered || 0}
                filterPreset={currentPreset}
                userFilters={userFilters}
                onFilterStar={onFilterStar}
                isLoading={false}
                filterControls={nullable(
                    groupedView,
                    () => (
                        <FiltersMenuItem active onClick={() => setGroupBy(undefined)}>
                            {tr('Ungroup')}
                        </FiltersMenuItem>
                    ),
                    <FiltersMenuItem onClick={() => setGroupBy('project')}>{tr('Group')}</FiltersMenuItem>,
                )}
            >
                {nullable(
                    groupedView,
                    () => (
                        <GroupedGoalList queryState={queryState} onTagClick={setTagsFilterOutside} />
                    ),
                    <FlatGoalList queryState={queryState} onTagClick={setTagsFilterOutside} />,
                )}
            </FilteredPage>
        </Page>
    );
};
