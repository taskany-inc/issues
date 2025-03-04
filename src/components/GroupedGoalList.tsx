import { useCallback, useEffect, useMemo } from 'react';
import { nullable } from '@taskany/bricks';
import { ListView } from '@taskany/bricks/harmony';

import { refreshInterval } from '../utils/config';
import { trpc } from '../utils/trpcClient';
import { useFMPMetric } from '../utils/telemetry';
import { FilterById, GoalByIdReturnType, GroupedProjectById } from '../../trpc/inferredTypes';
import { useUrlFilterParams } from '../hooks/useUrlFilterParams';

import { LoadMoreButton } from './LoadMoreButton/LoadMoreButton';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';
import { ProjectListItemConnected } from './ProjectListItemConnected/ProjectListItemConnected';

interface GroupedGoalListProps {
    filterPreset?: FilterById;
}

export const projectsSize = 20;

const ProjectItem: React.FC<{ project: GroupedProjectById; preset?: FilterById }> = ({ project, preset }) => {
    const { queryState } = useUrlFilterParams({ preset });

    const { data } = trpc.v2.project.getProjectChildrenTree.useQuery({
        id: project.id,
        goalsQuery: queryState,
    });

    return (
        <ProjectListItemConnected
            key={project.id}
            project={project}
            filterPreset={preset}
            actionButtonView="icons"
            subTree={data?.[project.id]}
        />
    );
};

export const GroupedGoalList: React.FC<GroupedGoalListProps> = ({ filterPreset }) => {
    const { setPreview, on } = useGoalPreview();

    const { queryState, projectsSort } = useUrlFilterParams({
        preset: filterPreset,
    });

    const utils = trpc.useContext();
    const { data, fetchNextPage, hasNextPage } = trpc.v2.project.getAll.useInfiniteQuery(
        {
            limit: projectsSize,
            goalsQuery: queryState,
            projectsSort,
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
                <ProjectItem key={project.id} project={project} preset={filterPreset} />
            ))}

            {nullable(hasNextPage, () => (
                <LoadMoreButton onClick={() => fetchNextPage()} />
            ))}
        </ListView>
    );
};
