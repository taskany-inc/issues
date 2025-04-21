import React, { useCallback } from 'react';
import { ListView } from '@taskany/bricks/harmony';

import { Page } from '../Page/Page';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { getPageTitle } from '../../utils/getPageTitle';
import { tr } from '../GoalsPage/GoalsPage.i18n';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { ProjectItem } from '../GroupedGoalList';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { trpc } from '../../utils/trpcClient';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';

export const TeamGroupedGoalsList = ({
    user,
    ssrTime,
    defaultPresetFallback,
    params: { externalTeamId },
}: ExternalPageProps) => {
    const { setPreview } = useGoalPreview();
    const { preset } = useFiltersPreset({ defaultPresetFallback });

    const {
        currentPreset,
        queryState: urlQueryState,
        groupBy,
    } = useUrlFilterParams({
        preset,
    });

    const { data: projects = [] } = trpc.v2.project.getCrewTeamProjectGoals.useQuery({ id: externalTeamId });
    const projectIds = projects.map(({ id }) => id);

    const queryState = {
        ...urlQueryState,
        project: projectIds,
    };

    const { data } = trpc.goal.getGoalsCount.useQuery({ query: queryState });

    const groupedView = groupBy === 'project';

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
            header={
                <FiltersPanel
                    title={getPageTitle({
                        title: tr('Goals'),
                        presetTitle: currentPreset?.title,
                    })}
                    total={data?.count || 0}
                    counter={data?.filtered || 0}
                    filterPreset={currentPreset}
                    enableProjectsSort={groupedView}
                />
            }
        >
            <ListView onKeyboardClick={handleItemEnter}>
                {projects?.map((project) => (
                    <ProjectItem key={project.id} project={project} />
                ))}
            </ListView>
        </Page>
    );
};
