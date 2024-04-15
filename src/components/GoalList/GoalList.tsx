import React, { useCallback } from 'react';
import { Goal } from '@prisma/client';
import { IconXCircleSolid } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { routes } from '../../hooks/router';
import { State } from '../../../trpc/inferredTypes';
import { GoalBadge } from '../GoalBadge';
import { List } from '../List/List';

import s from './GoalList.module.css';

interface GoalDependencyListByKindProps<T> {
    goals: T[];
    onClick?: (item: T) => void;
    onRemove?: (values: T) => Promise<void>;
    canEdit?: boolean;
}

export const GoalList = <T extends Goal & { state?: State | null; _shortId: string }>({
    goals = [],
    onClick,
    onRemove,
    canEdit,
    ...attrs
}: GoalDependencyListByKindProps<T>) => {
    const onRemoveHandler = useCallback(
        (goal: T) => async () => {
            await onRemove?.(goal);
        },
        [onRemove],
    );

    const onClickHandler = useCallback(
        (goal: T) => (e: React.MouseEvent) => {
            e.preventDefault();
            onClick?.(goal);
        },
        [onClick],
    );

    return (
        <List
            list={goals}
            className={s.GoalListTextList}
            renderItem={(goal) => (
                <GoalBadge
                    title={goal.title}
                    state={goal.state ?? undefined}
                    href={routes.goal(goal._shortId)}
                    onClick={onClickHandler(goal)}
                    {...attrs}
                >
                    {nullable(canEdit, () => (
                        <IconXCircleSolid size="xs" onClick={onRemoveHandler(goal)} />
                    ))}
                </GoalBadge>
            )}
        ></List>
    );
};
