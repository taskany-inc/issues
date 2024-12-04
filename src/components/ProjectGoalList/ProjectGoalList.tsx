import { FC, useMemo } from 'react';
import { nullable } from '@taskany/bricks';

import { FilterById } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { refreshInterval } from '../../utils/config';
import { safeUserData } from '../../utils/getUserName';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useGoalPreviewInvalidate } from '../../hooks/useGoalPreviewInvalidate';
import { GoalTableList, mapToRenderProps } from '../GoalTableList/GoalTableList';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { NoGoalsText } from '../NoGoalsText/NoGoalsText';
import { Loader } from '../Loader/Loader';

interface ProjectGoalListProps {
    id: string;
    filterPreset?: FilterById;
    partnershipProject?: string[];
    showNoGoals?: boolean;
    askRights?: boolean;
}

const onGoalClickHandler = (e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
    } else {
        e.stopPropagation();
    }
};

export const ProjectGoalList: FC<ProjectGoalListProps> = ({
    id,
    filterPreset,
    partnershipProject,
    showNoGoals,
    askRights,
}) => {
    const { queryState, setTagsFilterOutside } = useUrlFilterParams({
        preset: filterPreset,
    });

    const {
        data,
        isLoading,
        isFetching: isGoalsFetch,
        fetchNextPage: fetchNextGoals,
        hasNextPage,
    } = trpc.v2.project.getProjectGoalsById.useInfiniteQuery(
        {
            id,
            askRights,
            goalsQuery: {
                ...queryState,
                partnershipProject: partnershipProject ?? undefined,
            },
        },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
            getNextPageParam: ({ pagination }) => pagination.offset,
        },
    );

    const goals = useMemo(() => {
        if (data == null) {
            return [];
        }

        return data.pages.reduce<(typeof data)['pages'][number]['goals']>((acc, cur) => {
            acc.push(...cur.goals);
            return acc;
        }, []);
    }, [data]);

    useGoalPreviewInvalidate(goals);

    return nullable(
        !isLoading,
        () =>
            nullable(
                goals,
                (g) => (
                    <>
                        <GoalTableList
                            goals={mapToRenderProps(g, (goal) => ({
                                ...goal,
                                shortId: goal._shortId,
                                commentsCount: goal._count.comments,
                                owner: safeUserData(goal.owner),
                                participants: goal.participants?.map(safeUserData),
                                achievedCriteriaWeight: goal._achivedCriteriaWeight,
                                partnershipProjects: goal.partnershipProjects,
                                isInPartnerProject: id !== goal.projectId,
                            }))}
                            onTagClick={setTagsFilterOutside}
                            onGoalClick={onGoalClickHandler}
                        />
                        {nullable(hasNextPage, () => (
                            <LoadMoreButton disabled={isGoalsFetch} onClick={fetchNextGoals as () => void} />
                        ))}
                    </>
                ),
                nullable(showNoGoals, () => <NoGoalsText />),
            ),
        <Loader />,
    );
};
