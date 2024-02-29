import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { ListView, nullable } from '@taskany/bricks';

import { QueryState } from '../hooks/useUrlFilterParams';
import { trpc } from '../utils/trpcClient';
import { refreshInterval } from '../utils/config';
import { useFMPMetric } from '../utils/telemetry';
import { GoalByIdReturnType } from '../../trpc/inferredTypes';

import { GoalTableList } from './GoalTableList/GoalTableList';
import { useGoalPreview } from './GoalPreview/GoalPreviewProvider';
import { LoadMoreButton } from './LoadMoreButton/LoadMoreButton';

interface GoalListProps {
    queryState?: QueryState;
    onTagClick?: ComponentProps<typeof GoalTableList>['onTagClick'];
}

const pageSize = 20;

export const FlatGoalList: React.FC<GoalListProps> = ({ queryState, onTagClick }) => {
    const utils = trpc.useContext();
    const { setPreview, on } = useGoalPreview();

    const [, setPage] = useState(0);
    const { data, fetchNextPage, hasNextPage } = trpc.goal.getBatch.useInfiniteQuery(
        {
            limit: pageSize,
            query: queryState,
        },
        {
            getNextPageParam: (p) => p.nextCursor,
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', () => {
            utils.goal.getBatch.invalidate();
        });
        const unsubDelete = on('on:goal:delete', () => {
            utils.goal.getBatch.invalidate();
        });

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, utils.goal.getBatch]);

    useFMPMetric(!!data);

    const pages = data?.pages;
    const goalsOnScreen = useMemo(() => pages?.flatMap((p) => p.items), [pages]);

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

    return (
        <ListView onKeyboardClick={handleItemEnter}>
            {nullable(goalsOnScreen, (goals) => (
                <GoalTableList goals={goals} onTagClick={onTagClick} />
            ))}

            {nullable(hasNextPage, () => (
                <LoadMoreButton onClick={onFetchNextPage} />
            ))}
        </ListView>
    );
};
