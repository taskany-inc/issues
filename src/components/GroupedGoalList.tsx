import { useCallback, useEffect, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { ListView } from '@taskany/bricks/harmony';

import { refreshInterval } from '../utils/config';
import { trpc } from '../utils/trpcClient';
import { useFMPMetric } from '../utils/telemetry';
import { FilterById, GoalByIdReturnType } from '../../trpc/inferredTypes';
import { useUrlFilterParams } from '../hooks/useUrlFilterParams';

import { LoadMoreButton } from './LoadMoreButton/LoadMoreButton';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';
import { ProjectListItemConnected } from './ProjectListItemConnected/ProjectListItemConnected';

interface GroupedGoalListProps {
    filterPreset?: FilterById;
}

export const projectsSize = 20;

export const GroupedGoalList: React.FC<GroupedGoalListProps> = ({ filterPreset }) => {
    const { setPreview, on } = useGoalPreview();

    const { queryState } = useUrlFilterParams({
        preset: filterPreset,
    });

    const utils = trpc.useContext();
    const { data, fetchNextPage, hasNextPage } = trpc.v2.project.getAll.useInfiniteQuery(
        {
            limit: projectsSize,
            goalsQuery: queryState,
            firstLevel: !!queryState?.project?.length,
        },
        {
            getNextPageParam: ({ pagination }) => pagination.offset,
            staleTime: refreshInterval,
        },
    );

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', () => utils.v2.project.getAll.invalidate());
        const unsubDelete = on('on:goal:delete', () => utils.v2.project.getAll.invalidate());

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, utils.v2.project.getAll]);

    useFMPMetric(!!data);

    const projectsOnScreen = useMemo(() => {
        const pages = data?.pages || [];

        return pages.flatMap((page) => page.projects);
    }, [data]);

    const handleItemEnter = useCallback(
        (goal: NonNullable<GoalByIdReturnType>) => {
            setPreview(goal._shortId, goal);
        },
        [setPreview],
    );

    return (
        <ListView onKeyboardClick={handleItemEnter}>
            {projectsOnScreen.map((project) => (
                <ProjectListItemConnected
                    key={project.id}
                    project={project}
                    filterPreset={filterPreset}
                    actionButtonView="icons"
                />
            ))}

            {nullable(hasNextPage, () => (
                <LoadMoreButton onClick={() => fetchNextPage()} />
            ))}
        </ListView>
    );
};
