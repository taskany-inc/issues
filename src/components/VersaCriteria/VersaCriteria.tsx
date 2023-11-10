import React, { useCallback } from 'react';
import { IconXCircleSolid } from '@taskany/icons';
import { nullable } from '@taskany/bricks';
import styled from 'styled-components';
import { gapXs } from '@taskany/colors';

import { GoalBadge } from '../GoalBadge';
import { GoalCriteriaComboBox } from '../GoalCriteriaSuggest/GoalCriteriaSuggest';
import { IssueMeta } from '../IssueMeta';
import { TextList, TextListItem } from '../TextList';
import { usePageContext } from '../../hooks/usePageContext';
import { routes } from '../../hooks/router';
import { AddCriteriaSchema } from '../../schema/criteria';

import { tr } from './VersaCriteria.i18n';

type FormValues = Parameters<React.ComponentProps<typeof GoalCriteriaComboBox>['onSubmit']>[0];

interface GoalBadgeItemProps {
    criteriaId: string;
    stateColor?: number;
    id: string;
    title: string;
    scopedId: string;
}

interface VersaCriteriaProps {
    goalId: string;
    canEdit?: boolean;
    onGoalClick?: (goal: GoalBadgeItemProps) => void;
    versaCriterialList: GoalBadgeItemProps[];
    onSubmit: (values: AddCriteriaSchema) => Promise<void>;
    onRemove: (...args: any[]) => Promise<void>;
    validateGoalCriteriaBindings: (values: { selectedGoalId: string; currentGoalId: string }) => Promise<void>;
}

const StyledTextList = styled(TextList)`
    margin-left: ${gapXs};
`;

export const VersaCriteria: React.FC<VersaCriteriaProps> = ({
    goalId,
    canEdit,
    onGoalClick,
    versaCriterialList,
    validateGoalCriteriaBindings,
    onSubmit,
    onRemove,
}) => {
    const { themeId } = usePageContext();

    const handleRemoveConnectedGoal = useCallback(
        (id: string, removedGoalId: string) => async () => {
            await onRemove({
                id,
                goalId: removedGoalId,
            });
        },
        [onRemove],
    );

    const handleConnectGoal = useCallback(
        async (values: FormValues) => {
            if (values.title && values.selected) {
                await onSubmit({
                    title: values.title,
                    goalId: values.selected.id,
                    weight: values.weight,
                    goalAsGriteria: {
                        id: goalId,
                    },
                });
            }
        },
        [goalId, onSubmit],
    );

    const handleGoalClick = useCallback(
        (goal: GoalBadgeItemProps) => {
            return (event: React.MouseEvent) => {
                event.preventDefault();
                if (onGoalClick) {
                    onGoalClick(goal);
                }
            };
        },
        [onGoalClick],
    );

    const validateBindings = useCallback(
        (selectedId: string) => {
            return validateGoalCriteriaBindings({
                currentGoalId: goalId,
                selectedGoalId: selectedId,
            });
        },
        [goalId, validateGoalCriteriaBindings],
    );

    return (
        <IssueMeta title={tr('Is the criteria for')}>
            <StyledTextList listStyle="none">
                {nullable(versaCriterialList, (goals) =>
                    goals.map((goal) => (
                        <TextListItem key={goal.id}>
                            <GoalBadge
                                title={goal.title}
                                href={routes.goal(goal.scopedId)}
                                onClick={handleGoalClick(goal)}
                                color={goal.stateColor}
                                theme={themeId}
                            >
                                {nullable(canEdit, () => (
                                    <IconXCircleSolid
                                        size="xs"
                                        onClick={handleRemoveConnectedGoal(goal.criteriaId, goal.id)}
                                    />
                                ))}
                            </GoalBadge>
                        </TextListItem>
                    )),
                )}
                {nullable(canEdit, () => (
                    <TextListItem>
                        <GoalCriteriaComboBox onSubmit={handleConnectGoal} checkGoalsBindingsFor={validateBindings} />
                    </TextListItem>
                ))}
            </StyledTextList>
        </IssueMeta>
    );
};
