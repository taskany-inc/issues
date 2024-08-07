import { useCallback, useEffect, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { ListView } from '@taskany/bricks/harmony';

import { useUrlFilterParams } from '../hooks/useUrlFilterParams';
import { refreshInterval } from '../utils/config';
import { trpc } from '../utils/trpcClient';
import { useFMPMetric } from '../utils/telemetry';
import { FilterById, GoalByIdReturnType } from '../../trpc/inferredTypes';

import { LoadMoreButton } from './LoadMoreButton/LoadMoreButton';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';
import { ProjectListItemConnected } from './ProjectListItemConnected';

interface GroupedGoalListProps {
    filterPreset?: FilterById;
}

export const projectsSize = 20;

export const GroupedGoalList: React.FC<GroupedGoalListProps> = ({ filterPreset }) => {
    const { queryState } = useUrlFilterParams({
        preset: filterPreset,
    });
    const { setPreview, on } = useGoalPreview();
    const utils = trpc.useContext();
    const { data, fetchNextPage, hasNextPage } = trpc.project.getAll.useInfiniteQuery(
        {
            limit: projectsSize,
            includePersonal: true,
            firstLevel: !queryState?.project?.length,
            goalsQuery: queryState,
        },
        {
            getNextPageParam: (p) => p.nextCursor,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', () => {
            utils.project.getAll.invalidate();
        });
        const unsubDelete = on('on:goal:delete', () => {
            utils.project.getAll.invalidate();
        });

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, utils.project.getAll]);

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
                <ProjectListItemConnected key={project.id} project={project} filterPreset={filterPreset} />
            ))}

            {nullable(hasNextPage, () => (
                <LoadMoreButton onClick={() => fetchNextPage()} />
            ))}
        </ListView>
    );
};
