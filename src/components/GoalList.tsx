import React, { useCallback } from 'react';
import { Goal } from '@prisma/client';
import { IconXCircleSolid } from '@taskany/icons';
import styled from 'styled-components';
import { nullable } from '@taskany/bricks';

import { routes } from '../hooks/router';

import { GoalBadge } from './GoalBadge';
import { TextList, TextListItem } from './TextList';

const StyledTextList = styled(TextList)`
    margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
`;

interface GoalDependencyListByKindProps<T> {
    goals: T[];
    onClick?: (item: T) => void;
    onRemove?: (values: T) => Promise<void>;
    canEdit?: boolean;
}

export const GoalList = <T extends Goal & { state?: { hue?: number } | null; _shortId: string }>({
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
        <StyledTextList listStyle="none">
            {goals.map((goal) => (
                <TextListItem key={goal.id}>
                    <GoalBadge
                        title={goal.title}
                        color={goal?.state?.hue}
                        href={routes.goal(goal._shortId)}
                        onClick={onClickHandler(goal)}
                        {...attrs}
                    >
                        {nullable(canEdit, () => (
                            <IconXCircleSolid size="xs" onClick={onRemoveHandler(goal)} />
                        ))}
                    </GoalBadge>
                </TextListItem>
            ))}
        </StyledTextList>
    );
};
