import React, { useCallback } from 'react';
import { Goal } from '@prisma/client';
import { IconXCircleSolid } from '@taskany/icons';
import styled from 'styled-components';

import { ToggleGoalDependency } from '../schema/goal';
import { GoalDependencyItem } from '../../trpc/inferredTypes';
import { routes } from '../hooks/router';

import { GoalBadge } from './GoalBadge';

const StyledGoalBadge = styled(GoalBadge)`
    margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
`;

interface GoalDependency extends Goal, GoalDependencyItem {}
interface GoalDependencyListByKindProps {
    id: string;
    goals: GoalDependency[];
    onClick?: (item: GoalDependency) => void;
    onRemove?: (values: ToggleGoalDependency) => void;
}

export const GoalDependencyListByKind = ({ id, goals = [], onClick, onRemove }: GoalDependencyListByKindProps) => {
    const onClickHandler = useCallback(
        (goal: GoalDependency) => (e?: React.MouseEvent) => {
            if (onClick) {
                e?.preventDefault();
                onClick(goal);
            }
        },
        [onClick],
    );

    return goals.map((item) => (
        <StyledGoalBadge
            key={item.id}
            title={item.title}
            state={item?.state}
            href={routes.goal(item._shortId)}
            onClick={onClickHandler(item)}
        >
            <IconXCircleSolid
                size="xs"
                onClick={onRemove ? () => onRemove({ id, kind: item._kind, relation: { id: item.id } }) : undefined}
            />
        </StyledGoalBadge>
    ));
};
