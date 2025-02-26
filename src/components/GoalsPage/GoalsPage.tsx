import React from 'react';
import { nullable } from '@taskany/bricks';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { trpc } from '../../utils/trpcClient';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { Page } from '../Page/Page';
import { getPageTitle } from '../../utils/getPageTitle';
import { GroupedGoalList } from '../GroupedGoalList';
import { FlatGoalList } from '../FlatGoalList';
import { PresetModals } from '../PresetModals';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';

import { tr } from './GoalsPage.i18n';

export const GoalsPage = ({ user, ssrTime, defaultPresetFallback, baseQueryState }: ExternalPageProps) => {
    const { preset } = useFiltersPreset({
        defaultPresetFallback,
    });

    const {
        currentPreset,
        queryState: urlQueryState,
        groupBy,
    } = useUrlFilterParams({
        preset,
    });

    const queryState = {
        ...urlQueryState,
        ...baseQueryState,
    };

    const { data } = trpc.goal.getGoalsCount.useQuery({
        query: queryState,
        baseQuery: baseQueryState,
    });

    const groupedView = groupBy === 'project';

    return (
        <Page
            user={user}
            ssrTime={ssrTime}
            title={tr('title')}
            header={
                <FiltersPanel
                    title={getPageTitle({
                        title: tr('Goals'),
                        presetTitle: currentPreset?.title,
                    })}
                    total={data?.count || 0}
                    counter={data?.filtered || 0}
                    filterPreset={preset}
                    enableViewToggle
                    enableProjectsSort={groupedView}
                />
            }
        >
            {nullable(
                groupedView,
                () => (
                    <GroupedGoalList filterPreset={preset} />
                ),
                <FlatGoalList filterPreset={preset} />,
            )}
            <PresetModals preset={preset} />
        </Page>
    );
};
