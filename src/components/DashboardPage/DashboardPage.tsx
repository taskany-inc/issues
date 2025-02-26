import React, { useCallback, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { ListView } from '@taskany/bricks/harmony';

import { refreshInterval } from '../../utils/config';
import { dashboardLoadMore } from '../../utils/domObjects';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { getPageTitle } from '../../utils/getPageTitle';
import { Page } from '../Page/Page';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { useFMPMetric } from '../../utils/telemetry';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { ProjectListItemConnected } from '../ProjectListItemConnected/ProjectListItemConnected';
import { PresetModals } from '../PresetModals';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';

import { tr } from './DashboardPage.i18n';

export const DashboardPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const { preset } = useFiltersPreset({ defaultPresetFallback });

    const { currentPreset, queryState, projectsSort, view } = useUrlFilterParams({
        preset,
    });

    const { data, isFetching, fetchNextPage, hasNextPage } = trpc.v2.project.getUserDashboardProjects.useInfiniteQuery(
        {
            goalsQuery: {
                ...queryState,
                limit: 10,
            },
            projectsSort,
        },
        {
            getNextPageParam: ({ pagination }) => pagination.offset,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    const pages = useMemo(() => data?.pages || [], [data?.pages]);

    const [groupsOnScreen, goalsCount, totalGoalsCount] = useMemo(() => {
        const groups = pages?.[0]?.groups;

        const gr = pages.reduce<typeof groups>((acc, cur) => {
            acc.push(...cur.groups);
            return acc;
        }, []);

        return [
            gr,
            gr.reduce((acc, group) => acc + group._count.goals, 0),
            pages.reduce((acc, { totalGoalsCount = 0 }) => acc + Number(totalGoalsCount), 0),
        ];
    }, [pages]);

    useFMPMetric(!!data);

    const { setPreview } = useGoalPreview();

    const handleItemEnter = useCallback(
        (goal: NonNullable<GoalByIdReturnType>) => {
            setPreview(goal._shortId, goal);
        },
        [setPreview],
    );

    return (
        <Page
            user={user}
            ssrTime={ssrTime}
            title={tr('title')}
            scrollerShadow={view === 'kanban' ? 70 : 0}
            header={
                <FiltersPanel
                    title={getPageTitle({
                        title: tr('Dashboard'),
                        presetTitle: currentPreset?.title,
                    })}
                    total={totalGoalsCount}
                    counter={goalsCount}
                    filterPreset={preset}
                    enableLayoutToggle
                    enableProjectsSort
                    enableHideProjectToggle
                />
            }
        >
            <ListView onKeyboardClick={handleItemEnter}>
                {groupsOnScreen?.map(({ ...project }, i) => (
                    <ProjectListItemConnected
                        mainProject
                        key={project.id}
                        project={project}
                        filterPreset={preset}
                        partnershipProject={project.partnerProjectIds}
                        actionButtonView="icons"
                        visible={i === 0}
                    />
                ))}
            </ListView>

            {nullable(hasNextPage, () => (
                <LoadMoreButton
                    disabled={isFetching}
                    onClick={fetchNextPage as () => void}
                    {...dashboardLoadMore.attr}
                />
            ))}

            <PresetModals preset={preset} />
        </Page>
    );
};
