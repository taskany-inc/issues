import React, { ComponentProps, useCallback, useEffect, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { ListView, TreeViewElement } from '@taskany/bricks/harmony';

import { refreshInterval } from '../../utils/config';
import { dashboardLoadMore } from '../../utils/domObjects';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { buildKanban } from '../../utils/kanban';
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
import { Kanban } from '../Kanban/Kanban';
import { safeUserData } from '../../utils/getUserName';

import { tr } from './DashboardPage.i18n';

export const DashboardPage = ({ user, ssrTime, defaultPresetFallback }: ExternalPageProps) => {
    const utils = trpc.useContext();

    const { preset } = useFiltersPreset({ defaultPresetFallback });

    const { currentPreset, queryState, view } = useUrlFilterParams({
        preset,
    });

    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
        trpc.v2.project.userProjectsWithGoals.useInfiniteQuery(
            { goalsQuery: queryState },
            {
                getNextPageParam: ({ pagination }) => pagination.offset,
                keepPreviousData: true,
                staleTime: refreshInterval,
            },
        );

    const pages = useMemo(() => data?.pages || [], [data?.pages]);

    const [groupsOnScreen, canbansByProject, goalsCount, totalGoalsCount] = useMemo(() => {
        const groups = pages?.[0]?.groups;

        const gr = pages.reduce<typeof groups>((acc, cur) => {
            acc.push(...cur.groups);
            return acc;
        }, []);

        const canbans = gr.reduce<Record<string, ComponentProps<typeof Kanban>['value']>>((acum, project) => {
            acum[project.id] = buildKanban(project.goals ?? []);

            return acum;
        }, {});

        return [
            gr,
            canbans,
            gr.reduce((acc, group) => acc + group._count.goals, 0),
            pages.reduce((acc, { totalGoalsCount = 0 }) => acc + Number(totalGoalsCount), 0),
        ];
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
                    counter={goalsCount}
                    filterPreset={preset}
                    loading={isLoading}
                    enableLayoutToggle
                />
            }
        >
            <ListView onKeyboardClick={handleItemEnter}>
                {groupsOnScreen?.map(({ goals, ...project }) => {
                    const kanban = canbansByProject[project.id];

                    const children = nullable(
                        view === 'kanban',
                        () => <Kanban value={kanban} filterPreset={preset} />,
                        nullable(goals, (g) => (
                            <TreeViewElement>
                                <GoalTableList
                                    goals={g.map(
                                        ({
                                            _shortId,
                                            _counts,
                                            _achivedCriteriaWeight,
                                            title,
                                            id,
                                            participants,
                                            owner,
                                            tags,
                                            state,
                                            updatedAt,
                                            priority,
                                            partnershipProjects,
                                            estimate,
                                            estimateType,
                                            projectId,
                                            project: parent,
                                        }) => ({
                                            title,
                                            id,
                                            shortId: _shortId,
                                            commentsCount: _counts?.comments,
                                            tags,
                                            updatedAt,
                                            owner: safeUserData(owner),
                                            participants: participants?.map(safeUserData),
                                            state,
                                            estimate: estimate
                                                ? {
                                                      value: estimate,
                                                      type: estimateType,
                                                  }
                                                : null,
                                            priority: priority.title,
                                            achievedCriteriaWeight: _achivedCriteriaWeight,
                                            partnershipProjects,
                                            isInPartnerProject: project.id !== projectId,
                                            project: parent,
                                        }),
                                    )}
                                />
                            </TreeViewElement>
                        )),
                    );

                    return (
                        <ProjectListItemCollapsable
                            key={project.id}
                            interactive={false}
                            visible
                            project={project}
                            href={routes.project(project.id, view ? `view=${view}` : undefined)}
                            goals={children}
                        >
                            {nullable(!goals?.length, () => (
                                <InlineCreateGoalControl project={project} />
                            ))}
                        </ProjectListItemCollapsable>
                    );
                })}
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
