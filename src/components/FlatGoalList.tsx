import { useCallback, useEffect, useMemo, useState } from 'react';
import { nullable } from '@taskany/bricks';
import { ListView } from '@taskany/bricks/harmony';

import { useUrlFilterParams } from '../hooks/useUrlFilterParams';
import { trpc } from '../utils/trpcClient';
import { refreshInterval } from '../utils/config';
import { useFMPMetric } from '../utils/telemetry';
import { FilterById, GoalByIdReturnType } from '../../trpc/inferredTypes';
import { safeUserData } from '../utils/getUserName';

import { GoalTableList, mapToRenderProps } from './GoalTableList/GoalTableList';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';
import { LoadMoreButton } from './LoadMoreButton/LoadMoreButton';

interface GoalListProps {
    filterPreset?: FilterById;
}

const pageSize = 20;

export const FlatGoalList: React.FC<GoalListProps> = ({ filterPreset }) => {
    const utils = trpc.useContext();
    const { setPreview, on } = useGoalPreview();
    const { queryState, setTagsFilterOutside } = useUrlFilterParams({
        preset: filterPreset,
    });

    const [, setPage] = useState(0);
    const { data, fetchNextPage, hasNextPage, isLoading } = trpc.v2.goal.getAllGoals.useInfiniteQuery(
        {
            limit: pageSize,
            goalsQuery: queryState,
        },
        {
            getNextPageParam: ({ pagination }) => pagination.offset,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', () => {
            utils.v2.goal.getAllGoals.invalidate();
        });
        const unsubDelete = on('on:goal:delete', () => {
            utils.v2.goal.getAllGoals.invalidate();
        });

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, utils.v2.goal.getAllGoals]);

    useFMPMetric(!!data);

    const pages = data?.pages;
    const goalsOnScreen = useMemo(() => {
        const list = pages?.flatMap((p) => p.goals);

        const renderList = mapToRenderProps(list ?? [], (goal) => ({
            ...goal,
            owner: safeUserData(goal.owner),
            participants: goal.participants?.map(safeUserData),
            shortId: goal._shortId,
            commentsCount: goal._count.comments,
            achievedCriteriaWeight: goal._achivedCriteriaWeight,
        }));

        return { list, renderList };
    }, [pages]);

    const onFetchNextPage = useCallback(() => {
        fetchNextPage();
        setPage((prev) => prev++);
    }, [fetchNextPage]);

    const handleItemEnter = useCallback(
        (goal: NonNullable<GoalByIdReturnType>) => {
            setPreview(goal._shortId, goal);
        },
        [setPreview],
    );

    const enableManualSorting = Boolean(queryState?.sort?.some(({ key }) => key === 'rankGlobal')) && !isLoading;

    const invalidate = useCallback(() => {
        utils.v2.goal.getAllGoals.invalidate();
    }, [utils]);

    return (
        <ListView onKeyboardClick={handleItemEnter}>
            {nullable(goalsOnScreen.renderList, (goals) => (
                <GoalTableList
                    goals={goals}
                    onTagClick={setTagsFilterOutside}
                    enableManualSorting={enableManualSorting}
                    invalidateGoals={invalidate}
                />
            ))}

            {nullable(hasNextPage, () => (
                <LoadMoreButton onClick={onFetchNextPage} />
            ))}
        </ListView>
    );
};
