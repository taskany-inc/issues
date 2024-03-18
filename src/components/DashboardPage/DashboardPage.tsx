import React, { useCallback, useEffect, useMemo } from 'react';
import { ListView, nullable } from '@taskany/bricks';
import { TreeViewElement } from '@taskany/bricks/harmony';

import { refreshInterval } from '../../utils/config';
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
import { InlineCreateGoalControl } from '../InlineCreateGoalControl/InlineCreateGoalControl';
import { ProjectListItemCollapsable } from '../ProjectListItemCollapsable/ProjectListItemCollapsable';
import { routes } from '../../hooks/router';
import { GoalTableList } from '../GoalTableList/GoalTableList';
import { PresetModals } from '../PresetModals';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';

import { tr } from './DashboardPage.i18n';

export const projectsLimit = 5;

export const DashboardPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const utils = trpc.useContext();

    const { preset } = useFiltersPreset({ defaultPresetFallback });

    const { currentPreset, queryState } = useUrlFilterParams({
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

    const { setPreview, on } = useGoalPreview();

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', () => {
            utils.project.getUserProjectsWithGoals.invalidate();
        });

        const unsubDelete = on('on:goal:delete', () => {
            utils.project.getUserProjectsWithGoals.invalidate();
        });

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, utils.project.getUserProjectsWithGoals]);

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
            header={
                <FiltersPanel
                    title={getPageTitle({
                        title: tr('Dashboard'),
                        shadowPresetTitle: currentPreset?.title,
                        currentPresetTitle: currentPreset?.title,
                    })}
                    total={totalGoalsCount}
                    counter={goals?.length}
                    filterPreset={preset}
                    loading={isLoading}
                />
            }
        >
            <ListView onKeyboardClick={handleItemEnter}>
                {groupsOnScreen?.map(({ project, goals }) => (
                    <ProjectListItemCollapsable
                        key={project.id}
                        interactive={false}
                        visible
                        project={project}
                        href={routes.project(project.id)}
                        goals={nullable(goals, (g) => (
                            <TreeViewElement>
                                <GoalTableList goals={g} />
                            </TreeViewElement>
                        ))}
                    >
                        {nullable(!goals.length, () => (
                            <InlineCreateGoalControl project={project} />
                        ))}
                    </ProjectListItemCollapsable>
                ))}
            </ListView>

            {nullable(hasNextPage, () => (
                <LoadMoreButton onClick={fetchNextPage as () => void} />
            ))}

            <PresetModals preset={preset} />
        </Page>
    );
};
