import { MouseEventHandler, useCallback } from 'react';
import { KanbanColumn, KanbanContainer } from '@taskany/bricks/harmony';

import { trpc } from '../../utils/trpcClient';
import { FilterById, DashboardGoal } from '../../../trpc/inferredTypes';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { NextLink } from '../NextLink';
import { State as KanbanState } from '../State';
import { GoalsKanbanCard } from '../GoalsKanbanCard/GoalsKanbanCard';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { routes } from '../../hooks/router';

import s from './Kanban.module.css';

interface KanbanProps<T> {
    value: Record<string, T[]>;
    filterPreset?: FilterById;
}

export const Kanban = <T extends NonNullable<DashboardGoal>>({ value, filterPreset }: KanbanProps<T>) => {
    const { data: states = [] } = trpc.state.all.useQuery();

    const { queryState, setTagsFilterOutside } = useUrlFilterParams({
        preset: filterPreset,
    });

    const { setPreview } = useGoalPreview();

    const onGoalPreviewShow = useCallback(
        (goal: Parameters<typeof setPreview>[1]): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey || !goal?._shortId) return;

                e.preventDefault();
                setPreview(goal._shortId, goal);
            },
        [setPreview],
    );

    return (
        <KanbanContainer>
            {states.map((state) => {
                const hasState = queryState?.state?.some((id) => id === state.id);
                const hasStateType = queryState?.stateType?.some((stateType) => stateType === state.type);
                const filtersEmpty = !queryState?.state?.length && !queryState?.stateType?.length;

                if (!filtersEmpty && !hasState && !hasStateType) {
                    return null;
                }

                const goals = value[state.id] ?? [];

                return (
                    <KanbanColumn key={state.id}>
                        <KanbanState className={s.KanbanState} state={state} />

                        {goals.map((g) => {
                            const { project: _, ...goal } = g;

                            return (
                                <NextLink
                                    key={goal.id}
                                    href={routes.goal(goal._shortId)}
                                    onClick={onGoalPreviewShow(goal)}
                                    className={s.KanbanLink}
                                >
                                    <GoalsKanbanCard
                                        id={goal.id}
                                        key={goal.id}
                                        commentsCount={goal._count.comments || 0}
                                        title={goal.title}
                                        updatedAt={goal.updatedAt}
                                        owner={goal.owner}
                                        estimate={goal.estimate}
                                        estimateType={goal.estimateType}
                                        tags={goal.tags}
                                        onTagClick={setTagsFilterOutside}
                                        priority={goal.priority}
                                        progress={goal._achivedCriteriaWeight}
                                    />
                                </NextLink>
                            );
                        })}
                    </KanbanColumn>
                );
            })}
        </KanbanContainer>
    );
};
