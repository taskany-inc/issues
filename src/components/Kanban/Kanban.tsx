import React, { MouseEventHandler, useCallback } from 'react';
import { KanbanColumn, KanbanContainer } from '@taskany/bricks/harmony';

import { trpc } from '../../utils/trpcClient';
import { FilterById } from '../../../trpc/inferredTypes';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { NextLink } from '../NextLink';
import { State as KanbanState } from '../State';
import { GoalsKanbanCard } from '../GoalsKanbanCard/GoalsKanbanCard';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { routes } from '../../hooks/router';

import s from './Kanban.module.css';

type KanbanItemProps = Omit<
    React.ComponentProps<typeof GoalsKanbanCard>,
    keyof React.HTMLAttributes<HTMLDivElement>
> & { id: string; shortId: string; title: string };

interface KanbanProps {
    value: Record<string, KanbanItemProps[]>;
    filterPreset?: FilterById;
}

export const Kanban = ({ value, filterPreset }: KanbanProps) => {
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

                        {goals.map((goal) => {
                            return (
                                <NextLink
                                    key={goal.id}
                                    href={routes.goal(goal.shortId)}
                                    onClick={onGoalPreviewShow({
                                        _shortId: goal.shortId,
                                        title: goal.title,
                                    })}
                                    className={s.KanbanLink}
                                >
                                    <GoalsKanbanCard {...goal} onTagClick={setTagsFilterOutside} />
                                </NextLink>
                            );
                        })}
                    </KanbanColumn>
                );
            })}
        </KanbanContainer>
    );
};

type StateIdRecord = Record<'stateId', string>;

type NullableStateId = StateIdRecord | Record<'stateId', null>;

export const buildKanban = <T extends NullableStateId, M extends (val: T) => KanbanItemProps>(
    goals: T[],
    mapper: M,
): Record<StateIdRecord['stateId'], KanbanItemProps[]> => {
    return goals.reduce<Record<StateIdRecord['stateId'], KanbanItemProps[]>>((acum, goal) => {
        const stateKey = goal.stateId;

        if (!stateKey) {
            return acum;
        }

        if (!acum[stateKey]) {
            acum[stateKey] = [];
        }

        acum[stateKey].push(mapper(goal));

        return acum;
    }, {});
};
